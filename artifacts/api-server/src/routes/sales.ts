import { Router, type IRouter } from "express";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import {
  customersTable,
  db,
  ledgerEntriesTable,
  productsTable,
  saleItemsTable,
  salesTable,
} from "@workspace/db";
import {
  CreateSaleBody,
  GetSaleParams,
  ListSalesQueryParams,
} from "@workspace/api-zod";
import { RouteError, toNum } from "../lib/numeric";
import { getUserId } from "../lib/auth";

const router: IRouter = Router();

function serializeSale(
  row: typeof salesTable.$inferSelect,
  items: (typeof saleItemsTable.$inferSelect)[],
) {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: toNum(item.quantity),
      unitPrice: toNum(item.unitPrice),
      lineTotal: toNum(item.lineTotal),
    })),
    subtotal: toNum(row.subtotal),
    total: toNum(row.total),
    paidAmount: toNum(row.paidAmount),
    dueAmount: toNum(row.dueAmount),
    paymentMethod: row.paymentMethod,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/sales", async (req, res): Promise<void> => {
  const parsed = ListSalesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { from, to, customerId } = parsed.data;
  const userId = getUserId(req);

  const conditions = [eq(salesTable.userId, userId)];
  if (from) conditions.push(gte(salesTable.createdAt, new Date(from)));
  if (to) conditions.push(lte(salesTable.createdAt, new Date(to)));
  if (customerId !== undefined)
    conditions.push(eq(salesTable.customerId, customerId));

  const salesRows = await db
    .select()
    .from(salesTable)
    .where(and(...conditions))
    .orderBy(salesTable.createdAt);

  const saleIds = salesRows.map((s) => s.id);
  const allItems =
    saleIds.length > 0
      ? await db
          .select()
          .from(saleItemsTable)
          .where(inArray(saleItemsTable.saleId, saleIds))
      : [];
  const itemsBySale = new Map<number, (typeof saleItemsTable.$inferSelect)[]>();
  for (const item of allItems) {
    const list = itemsBySale.get(item.saleId) ?? [];
    list.push(item);
    itemsBySale.set(item.saleId, list);
  }

  res.json(
    salesRows
      .map((sale) => serializeSale(sale, itemsBySale.get(sale.id) ?? []))
      .reverse(),
  );
});

router.post("/sales", async (req, res): Promise<void> => {
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { items, paidAmount, paymentMethod, customerId } = parsed.data;

  // Payment-method invariants: "cash" sales must be fully paid, "baki" sales
  // must be unpaid and tied to a customer, and any due balance requires a
  // linked customer to carry it.
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const total = subtotal;

  if (paidAmount > total) {
    res.status(400).json({ error: "পরিশোধিত টাকা বিলের চেয়ে বেশি হতে পারবে না" });
    return;
  }
  if (paymentMethod === "cash" && paidAmount !== total) {
    res
      .status(400)
      .json({ error: "নগদ পেমেন্টে সম্পূর্ণ বিলের টাকা পরিশোধ করতে হবে" });
    return;
  }
  if (paymentMethod === "baki" && paidAmount !== 0) {
    res.status(400).json({ error: "বাকি পেমেন্টে কোনো টাকা পরিশোধ করা যাবে না" });
    return;
  }
  const dueAmount = Math.max(0, total - paidAmount);
  if ((dueAmount > 0 || paymentMethod === "baki") && customerId === undefined) {
    res
      .status(400)
      .json({ error: "বাকি রাখতে হলে একজন কাস্টমার বাছাই করতে হবে" });
    return;
  }

  // Merge duplicate product entries so stock is deducted once per product.
  const mergedQuantities = new Map<number, number>();
  for (const item of items) {
    mergedQuantities.set(
      item.productId,
      (mergedQuantities.get(item.productId) ?? 0) + item.quantity,
    );
  }

  try {
    const userId = getUserId(req);
    const result = await db.transaction(async (tx) => {
      const productRows = await tx
        .select()
        .from(productsTable)
        .where(eq(productsTable.userId, userId))
        .for("update");
      const productMap = new Map(productRows.map((p) => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new RouteError(
            400,
            `প্রোডাক্ট #${item.productId} পাওয়া যায়নি`,
          );
        }
      }

      for (const [productId, quantity] of mergedQuantities) {
        const product = productMap.get(productId)!;
        const remainingStock = toNum(product.stock) - quantity;
        if (remainingStock < 0) {
          throw new RouteError(
            400,
            `${product.name}-এর স্টক পর্যাপ্ত নেই (আছে ${toNum(product.stock)})`,
          );
        }
      }

      if (customerId !== undefined) {
        const [customer] = await tx
          .select()
          .from(customersTable)
          .where(
            and(
              eq(customersTable.id, customerId),
              eq(customersTable.userId, userId),
            ),
          );
        if (!customer) {
          throw new RouteError(400, "কাস্টমার পাওয়া যায়নি");
        }
      }

      const [sale] = await tx
        .insert(salesTable)
        .values({
          userId,
          customerId: customerId ?? null,
          customerName: parsed.data.customerName ?? null,
          customerPhone: parsed.data.customerPhone ?? null,
          subtotal: String(subtotal),
          total: String(total),
          paidAmount: String(paidAmount),
          dueAmount: String(dueAmount),
          paymentMethod,
        })
        .returning();

      const insertedItems = await tx
        .insert(saleItemsTable)
        .values(
          items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              saleId: sale.id,
              productId: item.productId,
              productName: product.name,
              quantity: String(item.quantity),
              unitPrice: String(item.unitPrice),
              costPrice: product.costPrice,
              lineTotal: String(item.quantity * item.unitPrice),
            };
          }),
        )
        .returning();

      for (const [productId, quantity] of mergedQuantities) {
        const product = productMap.get(productId)!;
        const newStock = toNum(product.stock) - quantity;
        await tx
          .update(productsTable)
          .set({ stock: String(newStock) })
          .where(
            and(
              eq(productsTable.id, productId),
              eq(productsTable.userId, userId),
            ),
          );
      }

      if (customerId !== undefined && dueAmount > 0) {
        const [customer] = await tx
          .select()
          .from(customersTable)
          .where(
            and(
              eq(customersTable.id, customerId),
              eq(customersTable.userId, userId),
            ),
          );

        const newBalance = toNum(customer!.bakiBalance) + dueAmount;
        await tx
          .update(customersTable)
          .set({ bakiBalance: String(newBalance) })
          .where(
            and(
              eq(customersTable.id, customerId),
              eq(customersTable.userId, userId),
            ),
          );

        await tx.insert(ledgerEntriesTable).values({
          userId,
          customerId,
          type: "sale",
          amount: String(dueAmount),
          balanceAfter: String(newBalance),
          note: `বিল #${sale.id}`,
        });
      }

      return { sale, insertedItems };
    });

    res.status(201).json(serializeSale(result.sale, result.insertedItems));
  } catch (err) {
    if (err instanceof RouteError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.get("/sales/:id", async (req, res): Promise<void> => {
  const params = GetSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sale] = await db
    .select()
    .from(salesTable)
    .where(
      and(
        eq(salesTable.id, params.data.id),
        eq(salesTable.userId, getUserId(req)),
      ),
    );

  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  const items = await db
    .select()
    .from(saleItemsTable)
    .where(eq(saleItemsTable.saleId, sale.id));

  res.json(serializeSale(sale, items));
});

export default router;

