import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { z } from "zod/v4";
import { db, masterProductsTable } from "@workspace/db";
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
 * Barcode lookup in the global catalogue. Read-only and shop-scoped only in the
 * sense that the caller must belong to a shop — the catalogue itself is shared.
 */
router.get("/master-products/lookup", async (req, res): Promise<void> => {
  requireShop(req);
  const barcode = z.string().trim().min(3).max(64).safeParse(req.query.barcode);
  if (!barcode.success) {
    res.status(400).json({ error: "বারকোড দিন" });
    return;
  }

  const [row] = await db
    .select()
    .from(masterProductsTable)
    .where(eq(masterProductsTable.barcode, barcode.data));

  if (!row) {
    res.status(404).json({ error: "এই বারকোড মাস্টার তালিকায় নেই" });
    return;
  }
  res.json(serialize(row));
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
