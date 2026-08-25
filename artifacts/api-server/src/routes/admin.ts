import { Router, type IRouter } from "express";
import { count, desc, eq } from "drizzle-orm";
import {
  db,
  shopsTable,
  shopUsersTable,
  productsTable,
  salesTable,
  customersTable,
  organizationsTable,
} from "@workspace/db";
import { requireSuperAdmin } from "../lib/rbac";
import { toNum } from "../lib/numeric";

const router: IRouter = Router();

/**
 * Global overview statistics for Platform Super Admin
 */
router.get("/admin/overview", async (req, res): Promise<void> => {
  requireSuperAdmin(req);

  const [
    totalShopsRow,
    totalUsersRow,
    totalSalesRow,
    totalProductsRow,
    totalCustomersRow,
    totalOrgsRow,
  ] = await Promise.all([
    db.select({ count: count() }).from(shopsTable),
    db.select({ count: count() }).from(shopUsersTable),
    db.select({ count: count() }).from(salesTable),
    db.select({ count: count() }).from(productsTable),
    db.select({ count: count() }).from(customersTable),
    db.select({ count: count() }).from(organizationsTable),
  ]);

  // Group by subscription plans
  const allShops = await db.select().from(shopsTable);
  const planCounts: Record<string, number> = {
    basic: 0,
    standard: 0,
    premium: 0,
    organization: 0,
  };
  const categoryCounts: Record<string, number> = {};

  for (const shop of allShops) {
    const plan = shop.subscriptionPlan || "basic";
    planCounts[plan] = (planCounts[plan] || 0) + 1;

    const cat = shop.category || "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  res.json({
    totalShops: totalShopsRow[0]?.count ?? 0,
    totalUsers: totalUsersRow[0]?.count ?? 0,
    totalSalesCount: totalSalesRow[0]?.count ?? 0,
    totalProducts: totalProductsRow[0]?.count ?? 0,
    totalCustomers: totalCustomersRow[0]?.count ?? 0,
    totalOrganizations: totalOrgsRow[0]?.count ?? 0,
    planCounts,
    categoryCounts,
    systemStatus: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
    },
  });
});

/**
 * List all shops across the platform (Super Admin only)
 */
router.get("/admin/shops", async (req, res): Promise<void> => {
  requireSuperAdmin(req);

  const rows = await db
    .select({
      id: shopsTable.id,
      name: shopsTable.name,
      category: shopsTable.category,
      ownerName: shopsTable.ownerName,
      ownerUserId: shopsTable.ownerUserId,
      area: shopsTable.area,
      subscriptionPlan: shopsTable.subscriptionPlan,
      cashboxAddon: shopsTable.cashboxAddon,
      organizationId: shopsTable.organizationId,
      createdAt: shopsTable.createdAt,
    })
    .from(shopsTable)
    .orderBy(desc(shopsTable.createdAt))
    .limit(100);

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

export default router;
