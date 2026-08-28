import { Router, type IRouter } from "express";
import { and, asc, desc, eq, gte, sum } from "drizzle-orm";
import { z } from "zod/v4";
import {
  CASH_MOVEMENT_TYPES,
  cashMovementsTable,
  cashSessionsTable,
  salesTable,
  db,
} from "@workspace/db";
import { RouteError, toNum } from "../lib/numeric";
import { requireRole, requireShop } from "../lib/tenant";

const router: IRouter = Router();

const OpenSessionBody = z.object({
  openingBalance: z.number().min(0).max(100_000_000),
  note: z.string().trim().max(300).optional(),
});

const MovementBody = z.object({
  type: z.enum(CASH_MOVEMENT_TYPES).exclude(["sale"]),
  amount: z.number().positive().max(100_000_000),
  note: z.string().trim().max(300).optional(),
});

const CloseSessionBody = z.object({
  countedClosing: z.number().min(0).max(100_000_000),
  note: z.string().trim().max(300).optional(),
});

function serializeSession(row: typeof cashSessionsTable.$inferSelect) {
  return {
    id: row.id,
    status: row.status,
    openingBalance: toNum(row.openingBalance),
    expectedClosing:
      row.expectedClosing === null ? null : toNum(row.expectedClosing),
    countedClosing:
      row.countedClosing === null ? null : toNum(row.countedClosing),
    difference: row.difference === null ? null : toNum(row.difference),
    note: row.note,
    openedAt: row.openedAt.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
  };
}

function serializeMovement(row: typeof cashMovementsTable.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    amount: toNum(row.amount),
    note: row.note,
    saleId: row.saleId,
    createdAt: row.createdAt.toISOString(),
  };
}

async function findOpenSession(shopId: number) {
  const [row] = await db
    .select()
    .from(cashSessionsTable)
    .where(
      and(
        eq(cashSessionsTable.shopId, shopId),
        eq(cashSessionsTable.status, "open"),
      ),
    )
    .orderBy(desc(cashSessionsTable.openedAt))
    .limit(1);
  return row ?? null;
}

/** Totals of every movement in a session, split by direction. */
async function sessionTotals(sessionId: number) {
  const rows = await db
    .select({ type: cashMovementsTable.type, total: sum(cashMovementsTable.amount) })
    .from(cashMovementsTable)
    .where(eq(cashMovementsTable.sessionId, sessionId))
    .groupBy(cashMovementsTable.type);

  const byType: Record<string, number> = {};
  for (const r of rows) byType[r.type] = toNum(r.total);

  const cashIn = (byType["sale"] ?? 0) + (byType["cash_in"] ?? 0);
  const cashOut = (byType["expense"] ?? 0) + (byType["cash_out"] ?? 0);
  return {
    cashSales: byType["sale"] ?? 0,
    cashIn: byType["cash_in"] ?? 0,
    expenses: byType["expense"] ?? 0,
    cashOut: byType["cash_out"] ?? 0,
    net: cashIn - cashOut,
  };
}

/** Current drawer state: open session (if any), its totals and movements. */
router.get("/cashbox/current", async (req, res): Promise<void> => {
  const { shopId } = requireShop(req);
  const session = await findOpenSession(shopId);
  if (!session) {
    res.json({ session: null, totals: null, movements: [], expectedClosing: null });
    return;
  }

  const totals = await sessionTotals(session.id);
  const movements = await db
    .select()
    .from(cashMovementsTable)
    .where(eq(cashMovementsTable.sessionId, session.id))
    .orderBy(asc(cashMovementsTable.createdAt));

  res.json({
    session: serializeSession(session),
    totals,
    movements: movements.map(serializeMovement),
    expectedClosing: toNum(session.openingBalance) + totals.net,
  });
});

/** Opens the drawer for the day. One open session per shop at a time. */
router.post("/cashbox/open", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "shopkeeper");
  const parsed = OpenSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (await findOpenSession(ctx.shopId)) {
    throw new RouteError(409, "ক্যাশ বক্স এখনই খোলা আছে");
  }

  const [row] = await db
    .insert(cashSessionsTable)
    .values({
      shopId: ctx.shopId,
      openedByUserId: ctx.userId,
      openingBalance: String(parsed.data.openingBalance),
      note: parsed.data.note ?? null,
    })
    .returning();

  res.status(201).json(serializeSession(row));
});

/** Manual cash movement: expense, extra cash in, or cash taken out. */
router.post("/cashbox/movements", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "shopkeeper");
  const parsed = MovementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const session = await findOpenSession(ctx.shopId);
  if (!session) {
    throw new RouteError(409, "আগে ক্যাশ বক্স খুলুন");
  }

  const [row] = await db
    .insert(cashMovementsTable)
    .values({
      shopId: ctx.shopId,
      sessionId: session.id,
      type: parsed.data.type,
      amount: String(parsed.data.amount),
      note: parsed.data.note ?? null,
      createdByUserId: ctx.userId,
    })
    .returning();

  res.status(201).json(serializeMovement(row));
});

/** Closing reconciliation: counted cash vs expected, difference recorded. */
router.post("/cashbox/close", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "manager");
  const parsed = CloseSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const session = await findOpenSession(ctx.shopId);
  if (!session) {
    throw new RouteError(409, "খোলা ক্যাশ বক্স পাওয়া যায়নি");
  }

  const totals = await sessionTotals(session.id);
  const expected = toNum(session.openingBalance) + totals.net;
  const difference = parsed.data.countedClosing - expected;

  const [row] = await db
    .update(cashSessionsTable)
    .set({
      status: "closed",
      expectedClosing: String(expected),
      countedClosing: String(parsed.data.countedClosing),
      difference: String(difference),
      note: parsed.data.note ?? session.note,
      closedAt: new Date(),
    })
    .where(eq(cashSessionsTable.id, session.id))
    .returning();

  res.json({ ...serializeSession(row), totals });
});

/** Closed-session history for the reconciliation report. */
router.get("/cashbox/sessions", async (req, res): Promise<void> => {
  const { shopId } = requireRole(req, "manager");
  const from = typeof req.query.from === "string" ? new Date(req.query.from) : null;

  const conditions = [eq(cashSessionsTable.shopId, shopId)];
  if (from && !Number.isNaN(from.getTime())) {
    conditions.push(gte(cashSessionsTable.openedAt, from));
  }

  const rows = await db
    .select()
    .from(cashSessionsTable)
    .where(and(...conditions))
    .orderBy(desc(cashSessionsTable.openedAt))
    .limit(60);

  res.json(rows.map(serializeSession));
});

/** Digital payment balances breakdown: sums digital sales by provider for open session (or today). */
router.get("/cashbox/digital-summary", async (req, res): Promise<void> => {
  const { shopId } = requireShop(req);
  const session = await findOpenSession(shopId);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const since = session?.openedAt ?? startOfDay;

  const digitalSales = await db
    .select()
    .from(salesTable)
    .where(
      and(
        eq(salesTable.shopId, shopId),
        eq(salesTable.paymentMethod, "digital"),
        gte(salesTable.createdAt, since),
      ),
    );

  const breakdown: Record<string, number> = {
    bkash: 0,
    nagad: 0,
    rocket: 0,
    upay: 0,
    card: 0,
    qr: 0,
    other: 0,
  };

  let totalDigital = 0;
  for (const s of digitalSales) {
    const paid = toNum(s.paidAmount);
    totalDigital += paid;
    const provider = (s.digitalProvider || "other").toLowerCase();
    if (provider in breakdown) {
      breakdown[provider] += paid;
    } else {
      breakdown.other += paid;
    }
  }

  res.json({
    since: since.toISOString(),
    totalDigital,
    breakdown,
    transactionCount: digitalSales.length,
  });
});

export default router;
