import { Router, type IRouter } from "express";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import {
  db,
  organizationsTable,
  salesTable,
  shopUsersTable,
  shopsTable,
} from "@workspace/db";
import { toNum } from "../lib/numeric";
import { organizationShopIds, requireRole, requireShop } from "../lib/tenant";

const router: IRouter = Router();

/** The caller's organization with every branch they may see. */
router.get("/organization", async (req, res): Promise<void> => {
  const ctx = requireShop(req);
  if (!ctx.organizationId) {
    res.json({ organization: null, branches: [] });
    return;
  }

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, ctx.organizationId));

  const ids = await organizationShopIds(ctx);
  const branches = await db
    .select()
    .from(shopsTable)
    .where(inArray(shopsTable.id, ids))
    .orderBy(shopsTable.id);

  res.json({
    organization: org ? { id: org.id, name: org.name } : null,
    branches: branches.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      area: b.area,
      isCurrent: b.id === ctx.shopId,
    })),
  });
});

/**
 * Chain-wide sales summary per branch (admins of an organization only —
 * `organizationShopIds` collapses to the single current shop otherwise).
 */
router.get("/organization/summary", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "manager");
  const days = Number(req.query.days) > 0 ? Math.min(Number(req.query.days), 365) : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const ids = await organizationShopIds(ctx);
  const rows = await db
    .select({
      shopId: salesTable.shopId,
      total: sql<string>`coalesce(sum(${salesTable.total}), 0)`,
      due: sql<string>`coalesce(sum(${salesTable.dueAmount}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(salesTable)
    .where(and(inArray(salesTable.shopId, ids), gte(salesTable.createdAt, since)))
    .groupBy(salesTable.shopId);

  const shops = await db
    .select({ id: shopsTable.id, name: shopsTable.name })
    .from(shopsTable)
    .where(inArray(shopsTable.id, ids));

  const staff = await db
    .select({ shopId: shopUsersTable.shopId, count: sql<number>`count(*)::int` })
    .from(shopUsersTable)
    .where(inArray(shopUsersTable.shopId, ids))
    .groupBy(shopUsersTable.shopId);

  const byShop = new Map(rows.map((r) => [r.shopId, r]));
  const staffByShop = new Map(staff.map((s) => [s.shopId, s.count]));

  const branches = shops.map((shop) => {
    const row = byShop.get(shop.id);
    return {
      shopId: shop.id,
      name: shop.name,
      totalSales: row ? toNum(row.total) : 0,
      totalDue: row ? toNum(row.due) : 0,
      transactions: row ? row.count : 0,
      staffCount: staffByShop.get(shop.id) ?? 0,
    };
  });

  res.json({
    days,
    branches,
    grandTotal: branches.reduce((sum, b) => sum + b.totalSales, 0),
    grandDue: branches.reduce((sum, b) => sum + b.totalDue, 0),
  });
});

export default router;
