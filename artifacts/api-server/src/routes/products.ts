import { Router, type IRouter } from "express";
import { and, eq, ilike } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
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
import { getUserId } from "../lib/auth";

const router: IRouter = Router();

function serializeProduct(row: typeof productsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    category: row.category,
    unit: row.unit,
    price: toNum(row.price),
    costPrice: row.costPrice === null ? null : toNum(row.costPrice),
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
  const userId = getUserId(req);

  const conditions = [eq(productsTable.userId, userId)];
  if (search) {
    conditions.push(ilike(productsTable.name, `%${search}%`));
  }

  let rows = await db
    .select()
    .from(productsTable)
    .where(and(...conditions))
    .orderBy(productsTable.name);

  if (lowStockOnly) {
    rows = rows.filter((r) => toNum(r.stock) <= toNum(r.lowStockThreshold));
  }

  res.json(rows.map(serializeProduct));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, barcode, category, unit, price, costPrice, stock } =
    parsed.data;

  try {
    const [row] = await db
      .insert(productsTable)
      .values({
        userId: getUserId(req),
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

    res.status(201).json(serializeProduct(row));
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      res.status(409).json({
        error: "এই বারকোডটি ইতিমধ্যে আপনার অন্য একটি পণ্যে ব্যবহার করা হয়েছে",
      });
      return;
    }
    throw err;
  }
});

router.get("/products/barcode/:code", async (req, res): Promise<void> => {
  const params = GetProductByBarcodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.barcode, params.data.code),
        eq(productsTable.userId, getUserId(req)),
      ),
    );

  if (!row) {
    res.status(404).json({ error: "এই বারকোডের কোনো প্রোডাক্ট পাওয়া যায়নি" });
    return;
  }

  res.json(serializeProduct(row));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.id, params.data.id),
        eq(productsTable.userId, getUserId(req)),
      ),
    );

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(serializeProduct(row));
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
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(serializeProduct(row));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
