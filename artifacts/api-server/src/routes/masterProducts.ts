import { Router, type IRouter } from "express";
import { desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod/v4";
import { db, masterProductsTable, productsTable } from "@workspace/db";
import { toNum } from "../lib/numeric";
import { requireShop } from "../lib/tenant";

const router: IRouter = Router();

function serialize(row: typeof masterProductsTable.$inferSelect) {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    nameBn: row.nameBn,
    brand: row.brand,
    category: row.category,
    unit: row.unit,
    defaultPrice: row.defaultPrice === null ? null : toNum(row.defaultPrice),
    imageUrl: row.imageUrl,
  };
}

/**
 * Barcode lookup in the global mother catalogue.
 * Checks master_products and community shop entries so any product added with
 * a barcode anywhere in Bangladesh becomes instantly recognized for all users.
 */
router.get("/master-products/lookup", async (req, res): Promise<void> => {
  requireShop(req);
  const barcode = z.string().trim().min(3).max(64).safeParse(req.query.barcode);
  if (!barcode.success) {
    res.status(400).json({ error: "বারকোড দিন" });
    return;
  }

  const cleanCode = barcode.data;

  // 1. Look in master_products table
  const [masterRow] = await db
    .select()
    .from(masterProductsTable)
    .where(eq(masterProductsTable.barcode, cleanCode));

  // 2. Query productsTable for the latest shop product with this barcode
  const [shopProduct] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.barcode, cleanCode))
    .orderBy(desc(productsTable.updatedAt))
    .limit(1);

  if (!masterRow && !shopProduct) {
    res.status(404).json({ error: "এই বারকোড মাস্টার তালিকায় নেই" });
    return;
  }

  // If found in shop product but missing from master catalogue, sync it now
  if (!masterRow && shopProduct) {
    try {
      await db
        .insert(masterProductsTable)
        .values({
          barcode: cleanCode,
          name: shopProduct.name,
          nameBn: shopProduct.name,
          brand: shopProduct.brand,
          category: shopProduct.category,
          unit: shopProduct.unit,
          defaultPrice: shopProduct.price,
        })
        .onConflictDoNothing();
    } catch {
      // ignore
    }
  }

  const name = masterRow?.name || shopProduct?.name || "";
  const nameBn = masterRow?.nameBn || shopProduct?.name || name;
  const brand = masterRow?.brand || shopProduct?.brand || "";
  const category = masterRow?.category || shopProduct?.category || "সাধারণ";
  const unit = masterRow?.unit || shopProduct?.unit || "পিস";
  const defaultPrice = masterRow?.defaultPrice
    ? toNum(masterRow.defaultPrice)
    : shopProduct?.price
    ? toNum(shopProduct.price)
    : 0;
  const costPrice = shopProduct?.costPrice
    ? toNum(shopProduct.costPrice)
    : defaultPrice > 0
    ? Math.round(defaultPrice * 0.85)
    : 0;
  const mfgDate = shopProduct?.mfgDate ? shopProduct.mfgDate.toISOString() : null;
  const expiryDate = shopProduct?.expiryDate ? shopProduct.expiryDate.toISOString() : null;
  const batchNumber = shopProduct?.batchNumber || null;
  const isPriceVariable = shopProduct?.isPriceVariable ?? false;

  res.json({
    id: masterRow?.id || shopProduct?.id || 0,
    barcode: cleanCode,
    name,
    nameBn,
    brand,
    category,
    unit,
    defaultPrice,
    costPrice,
    mfgDate,
    expiryDate,
    batchNumber,
    isPriceVariable,
    imageUrl: masterRow?.imageUrl || null,
  });
});

/** Name search, used by the invoice OCR matcher and the add-product form. */
router.get("/master-products", async (req, res): Promise<void> => {
  requireShop(req);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const rows = await db
    .select()
    .from(masterProductsTable)
    .where(
      search
        ? or(
            ilike(masterProductsTable.name, `%${search}%`),
            ilike(masterProductsTable.nameBn, `%${search}%`),
            ilike(masterProductsTable.barcode, `%${search}%`),
          )
        : undefined,
    )
    .limit(50);

  res.json(rows.map(serialize));
});

export default router;
