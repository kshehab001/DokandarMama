import { Router, type IRouter } from "express";
import { and, desc, eq, gt, ilike } from "drizzle-orm";
import { customersTable, db, ledgerEntriesTable } from "@workspace/db";
import {
  CreateCustomerBody,
  DeleteCustomerParams,
  GetCustomerLedgerParams,
  GetCustomerParams,
  ListCustomersQueryParams,
  RecordCustomerPaymentBody,
  RecordCustomerPaymentParams,
  UpdateCustomerBody,
  UpdateCustomerParams,
} from "@workspace/api-zod";
import { RouteError, toNum } from "../lib/numeric";
import { getUserId } from "../lib/auth";

const router: IRouter = Router();

function serializeCustomer(row: typeof customersTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    bakiBalance: toNum(row.bakiBalance),
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeLedgerEntry(row: typeof ledgerEntriesTable.$inferSelect) {
  return {
    id: row.id,
    customerId: row.customerId,
    type: row.type,
    amount: toNum(row.amount),
    balanceAfter: toNum(row.balanceAfter),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/customers", async (req, res): Promise<void> => {
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, withDueOnly } = parsed.data;
  const userId = getUserId(req);

  const conditions = [eq(customersTable.userId, userId)];
  if (search) {
    conditions.push(ilike(customersTable.name, `%${search}%`));
  }
  if (withDueOnly) {
    conditions.push(gt(customersTable.bakiBalance, "0"));
  }

  const rows = await db
    .select()
    .from(customersTable)
    .where(and(...conditions))
    .orderBy(customersTable.name);

  res.json(rows.map(serializeCustomer));
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(customersTable)
    .values({
      userId: getUserId(req),
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
    })
    .returning();

  res.status(201).json(serializeCustomer(row));
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(customersTable)
    .where(
      and(
        eq(customersTable.id, params.data.id),
        eq(customersTable.userId, getUserId(req)),
      ),
    );

  if (!row) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(serializeCustomer(row));
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<typeof customersTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;

  const [row] = await db
    .update(customersTable)
    .set(updates)
    .where(
      and(
        eq(customersTable.id, params.data.id),
        eq(customersTable.userId, getUserId(req)),
      ),
    )
    .returning();

  if (!row) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(serializeCustomer(row));
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(customersTable)
    .where(
      and(
        eq(customersTable.id, params.data.id),
        eq(customersTable.userId, getUserId(req)),
      ),
    );
  res.sendStatus(204);
});

router.get("/customers/:id/ledger", async (req, res): Promise<void> => {
  const params = GetCustomerLedgerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = getUserId(req);

  // Confirm the customer belongs to this shopkeeper before returning any
  // ledger rows, so one shop can't read another's ledger via a guessed ID.
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(
      and(eq(customersTable.id, params.data.id), eq(customersTable.userId, userId)),
    );
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const rows = await db
    .select()
    .from(ledgerEntriesTable)
    .where(
      and(
        eq(ledgerEntriesTable.customerId, params.data.id),
        eq(ledgerEntriesTable.userId, userId),
      ),
    )
    .orderBy(desc(ledgerEntriesTable.createdAt));

  res.json(rows.map(serializeLedgerEntry));
});

router.post("/customers/:id/payments", async (req, res): Promise<void> => {
  const params = RecordCustomerPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = RecordCustomerPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const userId = getUserId(req);
    const updatedCustomer = await db.transaction(async (tx) => {
      const [customer] = await tx
        .select()
        .from(customersTable)
        .where(
          and(
            eq(customersTable.id, params.data.id),
            eq(customersTable.userId, userId),
          ),
        )
        .for("update");

      if (!customer) {
        return null;
      }

      const currentDue = toNum(customer.bakiBalance);
      if (parsed.data.amount > currentDue) {
        throw new RouteError(
          400,
          `জমার পরিমাণ বাকির (৳${currentDue}) চেয়ে বেশি হতে পারবে না`,
        );
      }
      const newBalance = currentDue - parsed.data.amount;

      const [updated] = await tx
        .update(customersTable)
        .set({ bakiBalance: String(newBalance) })
        .where(
          and(
            eq(customersTable.id, params.data.id),
            eq(customersTable.userId, userId),
          ),
        )
        .returning();

      await tx.insert(ledgerEntriesTable).values({
        userId,
        customerId: params.data.id,
        type: "payment",
        amount: String(parsed.data.amount),
        balanceAfter: String(newBalance),
        note: parsed.data.note ?? null,
      });

      return updated;
    });

    if (!updatedCustomer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    res.status(201).json(serializeCustomer(updatedCustomer));
  } catch (err) {
    if (err instanceof RouteError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
