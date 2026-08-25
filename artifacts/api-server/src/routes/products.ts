import { Router, type IRouter } from "express";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, productsTable, type ShopRole } from "@workspace/db";
import {
  CreateProductBody,
  DeleteProductParams,
  GetProductByBarcodeParams,
  GetProductParams,
  ListProductsQueryParams,
  UpdateProductBody,
  UpdateProductParams,
} from "@workspace/api-zod";
import { toNum } from "../lib/numeric";
import { requireRole, requireShop } from "../lib/tenant";

const router: IRouter = Router();

function serializeProduct(
  row: typeof productsTable.$inferSelect,
  role?: ShopRole | null,
) {
  // Redact wholesale cost price for shopkeepers / low-privileged roles
  const hideCost = role === "shopkeeper";
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    category: row.category,
    unit: row.unit,
    price: toNum(row.price),
    costPrice: hideCost ? null : row.costPrice === null ? null : toNum(row.costPrice),
    stock: toNum(row.stock),
    lowStockThreshold: toNum(row.lowStockThreshold),
    isPriceVariable: row.isPriceVariable,
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, lowStockOnly } = parsed.data;
  const ctx = requireShop(req);

  const conditions = [eq(productsTable.shopId, ctx.shopId)];
  if (search) {
    // Search both name and barcode so typing/pasting a barcode in the billing
    // search box finds the product even if barcode-lookup returned 404.
    conditions.push(
      or(
        ilike(productsTable.name, `%${search}%`),
        ilike(productsTable.barcode, `%${search}%`),
      )!,
    );
  }

  let rows = await db
    .select()
    .from(productsTable)
    .where(and(...conditions))
    .orderBy(productsTable.name);

  if (lowStockOnly) {
    rows = rows.filter((r) => toNum(r.stock) <= toNum(r.lowStockThreshold));
  }

  res.json(rows.map((r) => serializeProduct(r, ctx.role)));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const shopCtx = requireRole(req, "manager");
  const { name, barcode, category, unit, price, costPrice, stock } =
    parsed.data;

  const [row] = await db
    .insert(productsTable)
    .values({
      userId: shopCtx.userId,
      shopId: shopCtx.shopId,
      name,
      barcode: barcode ?? null,
      category,
      unit,
      price: String(price),
      costPrice: costPrice === undefined ? null : String(costPrice),
      stock: String(stock ?? 0),
      lowStockThreshold:
        parsed.data.lowStockThreshold === undefined
          ? undefined
          : String(parsed.data.lowStockThreshold),
      isPriceVariable: parsed.data.isPriceVariable ?? false,
    })
    .returning();

  res.status(201).json(serializeProduct(row, shopCtx.role));
});

router.get("/products/barcode/:code", async (req, res): Promise<void> => {
  const params = GetProductByBarcodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const ctx = requireShop(req);
  const [row] = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.barcode, params.data.code),
        eq(productsTable.shopId, ctx.shopId),
      ),
    );

  if (!row) {
    res.status(404).json({ error: "এই বারকোডের কোনো প্রোডাক্ট পাওয়া যায়নি" });
    return;
  }

  res.json(serializeProduct(row, ctx.role));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const ctx = requireShop(req);
  const [row] = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.id, params.data.id),
        eq(productsTable.shopId, ctx.shopId),
      ),
    );

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(serializeProduct(row, ctx.role));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const shopCtx = requireRole(req, "manager");
  const data = parsed.data;
  const updates: Partial<typeof productsTable.$inferInsert> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.barcode !== undefined) updates.barcode = data.barcode;
  if (data.category !== undefined) updates.category = data.category;
  if (data.unit !== undefined) updates.unit = data.unit;
  if (data.price !== undefined) updates.price = String(data.price);
  if (data.costPrice !== undefined) updates.costPrice = String(data.costPrice);
  if (data.stock !== undefined) updates.stock = String(data.stock);
  if (data.lowStockThreshold !== undefined)
    updates.lowStockThreshold = String(data.lowStockThreshold);
  if (data.isPriceVariable !== undefined)
    updates.isPriceVariable = data.isPriceVariable;

  const [row] = await db
    .update(productsTable)
    .set(updates)
    .where(
      and(
        eq(productsTable.id, params.data.id),
        eq(productsTable.shopId, shopCtx.shopId),
      ),
    )
    .returning();

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(serializeProduct(row, shopCtx.role));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { shopId } = requireRole(req, "manager");
  await db
    .delete(productsTable)
    .where(
      and(
        eq(productsTable.id, params.data.id),
        eq(productsTable.shopId, shopId),
      ),
    );
  res.sendStatus(204);
});

export default router;
