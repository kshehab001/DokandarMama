import { Router, type IRouter } from "express";
import { and, eq, gte, inArray } from "drizzle-orm";
import {
  customersTable,
  db,
  productsTable,
  saleItemsTable,
  salesTable,
} from "@workspace/db";
import { GetSalesSummaryQueryParams, GetTopProductsQueryParams } from "@workspace/api-zod";
import { toNum } from "../lib/numeric";
import { requireRole, requireShop } from "../lib/tenant";

const router: IRouter = Router();

function rangeStart(range: "today" | "week" | "month"): Date {
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  const d = new Date(now);
  d.setDate(d.getDate() - 30);
  return d;
}

router.get("/dashboard/overview", async (req, res): Promise<void> => {
  const { shopId } = requireShop(req);
  const todayStart = rangeStart("today");

  const [allSales, allCustomers, allProducts] = await Promise.all([
    db
      .select()
      .from(salesTable)
      .where(eq(salesTable.shopId, shopId)),
    db.select().from(customersTable).where(eq(customersTable.shopId, shopId)),
    db.select().from(productsTable).where(eq(productsTable.shopId, shopId)),
  ]);

  const todaySales = allSales.filter((s) => s.createdAt >= todayStart);
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + toNum(s.total), 0);
  const totalDue = allCustomers.reduce(
    (sum, c) => sum + toNum(c.bakiBalance),
    0,
  );
  const lowStockCount = allProducts.filter(
    (p) => toNum(p.stock) <= toNum(p.lowStockThreshold),
  ).length;

  // Digital breakdown calculation across all sales
  const digitalBreakdown: Record<string, number> = {
    bkash: 0,
    nagad: 0,
    rocket: 0,
    upay: 0,
    card: 0,
    qr: 0,
    other: 0,
  };

  let totalDigital = 0;
  let totalCash = 0;

  for (const s of allSales) {
    const paid = toNum(s.paidAmount);
    if (s.paymentMethod === "digital") {
      totalDigital += paid;
      const provider = (s.digitalProvider || "other").toLowerCase();
      if (provider in digitalBreakdown) {
        digitalBreakdown[provider] += paid;
      } else {
        digitalBreakdown.other += paid;
      }
    } else if (s.paymentMethod === "cash" || s.paymentMethod === "mixed") {
      totalCash += paid;
    }
  }

  // Today specific breakdown
  let todayCash = 0;
  let todayDigital = 0;
  for (const s of todaySales) {
    const paid = toNum(s.paidAmount);
    if (s.paymentMethod === "digital") todayDigital += paid;
    else if (s.paymentMethod === "cash" || s.paymentMethod === "mixed") todayCash += paid;
  }

  res.json({
    todaySalesTotal,
    todayTransactionCount: todaySales.length,
    todayCash,
    todayDigital,
    totalDue,
    lowStockCount,
    customerCount: allCustomers.length,
    cashBalance: totalCash,
    digitalBalance: totalDigital,
    digitalBreakdown,
    totalCurrentBalance: totalCash + totalDigital,
  });
});

router.get("/reports/summary", async (req, res): Promise<void> => {
  const parsed = GetSalesSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { range } = parsed.data;
  const { shopId } = requireRole(req, "manager");
  const start = rangeStart(range);

  const [sales, products] = await Promise.all([
    db
      .select()
      .from(salesTable)
      .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, start))),
    db.select().from(productsTable).where(eq(productsTable.shopId, shopId)),
  ]);

  const saleIdsInRange = sales.map((s) => s.id);
  const itemsInRange =
    saleIdsInRange.length > 0
      ? await db
          .select()
          .from(saleItemsTable)
          .where(inArray(saleItemsTable.saleId, saleIdsInRange))
        : [];
  const costByProduct = new Map(
    products.map((p) => [p.id, p.costPrice === null ? null : toNum(p.costPrice)]),
  );

  const totalSales = sales.reduce((sum, s) => sum + toNum(s.total), 0);
  const totalProfit = itemsInRange.reduce((sum, item) => {
    const cost = costByProduct.get(item.productId);
    if (cost === null || cost === undefined) return sum;
    return sum + (toNum(item.unitPrice) - cost) * toNum(item.quantity);
  }, 0);
  const cashTotal = sales
    .filter((s) => s.paymentMethod !== "baki")
    .reduce((sum, s) => sum + toNum(s.paidAmount), 0);
  const bakiTotal = sales.reduce((sum, s) => sum + toNum(s.dueAmount), 0);

  res.json({
    range,
    totalSales,
    totalProfit,
    transactionCount: sales.length,
    cashTotal,
    bakiTotal,
  });
});

router.get("/reports/top-products", async (req, res): Promise<void> => {
  const parsed = GetTopProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { range } = parsed.data;
  const { shopId } = requireRole(req, "manager");
  const start = rangeStart(range);

  const sales = await db
    .select()
    .from(salesTable)
    .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, start)));

  const saleIdsInRange = sales.map((s) => s.id);
  const itemsInRange =
    saleIdsInRange.length > 0
      ? await db
          .select()
          .from(saleItemsTable)
          .where(inArray(saleItemsTable.saleId, saleIdsInRange))
      : [];

  const totalsByProduct = new Map<
    number,
    { productName: string; quantitySold: number; revenue: number }
  >();
  for (const item of itemsInRange) {
    const entry = totalsByProduct.get(item.productId) ?? {
      productName: item.productName,
      quantitySold: 0,
      revenue: 0,
    };
    entry.quantitySold += toNum(item.quantity);
    entry.revenue += toNum(item.lineTotal);
    totalsByProduct.set(item.productId, entry);
  }

  const result = Array.from(totalsByProduct.entries())
    .map(([productId, entry]) => ({ productId, ...entry }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  res.json(result);
});

router.get("/suggestions/restock", async (req, res): Promise<void> => {
  const { shopId } = requireRole(req, "manager");
  const thirtyDaysAgo = rangeStart("month");

  const [products, sales] = await Promise.all([
    db.select().from(productsTable).where(eq(productsTable.shopId, shopId)),
    db
      .select()
      .from(salesTable)
      .where(and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, thirtyDaysAgo))),
  ]);

  const saleIdsInRange = sales.map((s) => s.id);
  const itemsInRange =
    saleIdsInRange.length > 0
      ? await db
          .select()
          .from(saleItemsTable)
          .where(inArray(saleItemsTable.saleId, saleIdsInRange))
      : [];

  const soldByProduct = new Map<number, number>();
  for (const item of itemsInRange) {
    soldByProduct.set(
      item.productId,
      (soldByProduct.get(item.productId) ?? 0) + toNum(item.quantity),
    );
  }

  const suggestions = products
    .map((p) => {
      const stock = toNum(p.stock);
      const threshold = toNum(p.lowStockThreshold);
      const totalSold = soldByProduct.get(p.id) ?? 0;
      const avgDailySales = totalSold / 30;
      const isLow = stock <= threshold;
      const sellsFast = avgDailySales > 0 && stock / Math.max(avgDailySales, 0.01) <= 7;

      if (!isLow && !sellsFast) return null;

      const reason = isLow
        ? "স্টক কম আছে, এখনই অর্ডার দেওয়া উচিত"
        : "বিক্রি দ্রুত হচ্ছে, এক সপ্তাহের মধ্যে স্টক শেষ হয়ে যেতে পারে";

      return {
        productId: p.id,
        productName: p.name,
        stock,
        lowStockThreshold: threshold,
        avgDailySales,
        reason,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.stock - b.stock);

  res.json(suggestions);
});

router.get("/reports/export", async (req, res): Promise<void> => {
  const { shopId } = requireRole(req, "manager");
  const type = (req.query.type as string) || "all";
  const range = (req.query.range as "today" | "week" | "month" | "all") || "month";

  const [sales, products, customers] = await Promise.all([
    db
      .select()
      .from(salesTable)
      .where(
        range === "all"
          ? eq(salesTable.shopId, shopId)
          : and(eq(salesTable.shopId, shopId), gte(salesTable.createdAt, rangeStart(range))),
      )
      .orderBy(salesTable.createdAt),
    db.select().from(productsTable).where(eq(productsTable.shopId, shopId)),
    db.select().from(customersTable).where(eq(customersTable.shopId, shopId)),
  ]);

  res.json({
    shopId,
    exportedAt: new Date().toISOString(),
    range,
    sales: sales.map((s) => ({
      id: s.id,
      date: s.createdAt.toISOString(),
      total: toNum(s.total),
      paidAmount: toNum(s.paidAmount),
      dueAmount: toNum(s.dueAmount),
      paymentMethod: s.paymentMethod,
      digitalProvider: s.digitalProvider,
      digitalTrxId: s.digitalTrxId,
      customerName: s.customerName,
    })),
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      category: p.category,
      price: toNum(p.price),
      costPrice: p.costPrice ? toNum(p.costPrice) : null,
      stock: toNum(p.stock),
      unit: p.unit,
      mfgDate: p.mfgDate ? p.mfgDate.toISOString() : null,
      expiryDate: p.expiryDate ? p.expiryDate.toISOString() : null,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      bakiBalance: toNum(c.bakiBalance),
    })),
  });
});

export default router;
