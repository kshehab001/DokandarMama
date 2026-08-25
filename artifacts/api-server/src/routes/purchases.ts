import { Router, type IRouter } from "express";
import express from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  productsTable,
  purchaseInvoiceItemsTable,
  purchaseInvoicesTable,
} from "@workspace/db";
import { RouteError, toNum } from "../lib/numeric";
import { requireRole, requireShop } from "../lib/tenant";
import { parseInvoiceText, similarity } from "../lib/invoiceParse";

const router: IRouter = Router();

// Invoice photos arrive as data URLs, which are far bigger than the default
// 100kb JSON limit — only this router gets the larger body allowance.
const bigJson = express.json({ limit: "12mb" });

const CreateInvoiceBody = z.object({
  /** OCR text produced on the device from the invoice photo. */
  rawText: z.string().min(1).max(20_000),
  imageUrl: z.string().max(8_000_000).optional(),
  supplierName: z.string().trim().max(120).optional(),
});

const ConfirmBody = z.object({
  supplierName: z.string().trim().max(120).optional(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        quantity: z.number().positive().max(1_000_000),
        unitCost: z.number().min(0).max(10_000_000).nullable().optional(),
        productId: z.number().int().positive().nullable().optional(),
        /** When true, a new product is created for this line. */
        createNew: z.boolean().optional(),
        skip: z.boolean().optional(),
        sellPrice: z.number().min(0).max(10_000_000).optional(),
        unit: z.string().trim().max(30).optional(),
        category: z.string().trim().max(60).optional(),
      }),
    )
    .min(1)
    .max(200),
});

function serializeInvoice(
  row: typeof purchaseInvoicesTable.$inferSelect,
  items: (typeof purchaseInvoiceItemsTable.$inferSelect)[],
  suggestions: Record<number, { productId: number; name: string; score: number }[]> = {},
) {
  return {
    id: row.id,
    supplierName: row.supplierName,
    status: row.status,
    invoiceTotal: row.invoiceTotal === null ? null : toNum(row.invoiceTotal),
    createdAt: row.createdAt.toISOString(),
    confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
    items: items.map((item) => ({
      id: item.id,
      rawText: item.rawText,
      name: item.name,
      quantity: toNum(item.quantity),
      unitCost: item.unitCost === null ? null : toNum(item.unitCost),
      lineTotal: item.lineTotal === null ? null : toNum(item.lineTotal),
      matchedProductId: item.matchedProductId,
      status: item.status,
      suggestions: suggestions[item.id] ?? [],
    })),
  };
}

/** Upload: store the OCR text, parse it into lines and match against stock. */
router.post("/purchases", bigJson, async (req, res): Promise<void> => {
  const ctx = requireRole(req, "manager");
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const lines = parseInvoiceText(parsed.data.rawText);
  if (lines.length === 0) {
    throw new RouteError(
      422,
      "ছবিটি থেকে কোনো পণ্যের লাইন পড়া যায়নি — পরিষ্কার ছবি দিন বা হাতে যোগ করুন",
    );
  }

  const shopProducts = await db
    .select({ id: productsTable.id, name: productsTable.name })
    .from(productsTable)
    .where(eq(productsTable.shopId, ctx.shopId));

  const invoiceTotal = lines.reduce((sum, l) => sum + (l.lineTotal ?? 0), 0);

  const { invoice, items } = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(purchaseInvoicesTable)
      .values({
        shopId: ctx.shopId,
        createdByUserId: ctx.userId,
        supplierName: parsed.data.supplierName ?? null,
        imageUrl: parsed.data.imageUrl ?? null,
        rawOcrText: parsed.data.rawText,
        invoiceTotal: String(invoiceTotal),
        status: "parsed",
      })
      .returning();

    const inserted = await tx
      .insert(purchaseInvoiceItemsTable)
      .values(
        lines.map((line) => {
          const best = shopProducts
            .map((p) => ({ p, score: similarity(line.name, p.name) }))
            .sort((a, b) => b.score - a.score)[0];
          const matched = best && best.score >= 0.6 ? best.p.id : null;
          return {
            invoiceId: created.id,
            rawText: line.rawText,
            name: line.name,
            quantity: String(line.quantity),
            unitCost: line.unitCost === null ? null : String(line.unitCost),
            lineTotal: line.lineTotal === null ? null : String(line.lineTotal),
            status: matched ? ("matched" as const) : ("pending" as const),
            matchedProductId: matched,
          };
        }),
      )
      .returning();

    return { invoice: created, items: inserted };
  });

  // Top-3 alternatives per line, so the confirmation screen can offer a picker.
  const suggestions: Record<number, { productId: number; name: string; score: number }[]> = {};
  for (const item of items) {
    suggestions[item.id] = shopProducts
      .map((p) => ({ productId: p.id, name: p.name, score: similarity(item.name, p.name) }))
      .filter((s) => s.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  res.status(201).json(serializeInvoice(invoice, items, suggestions));
});

router.get("/purchases", async (req, res): Promise<void> => {
  const { shopId } = requireRole(req, "manager");
  const rows = await db
    .select()
    .from(purchaseInvoicesTable)
    .where(eq(purchaseInvoicesTable.shopId, shopId))
    .orderBy(desc(purchaseInvoicesTable.createdAt))
    .limit(50);

  res.json(
    rows.map((row) => ({
      id: row.id,
      supplierName: row.supplierName,
      status: row.status,
      invoiceTotal: row.invoiceTotal === null ? null : toNum(row.invoiceTotal),
      createdAt: row.createdAt.toISOString(),
      confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
    })),
  );
});

router.get("/purchases/:id", async (req, res): Promise<void> => {
  const { shopId } = requireRole(req, "manager");
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid invoice id" });
    return;
  }

  const [invoice] = await db
    .select()
    .from(purchaseInvoicesTable)
    .where(
      and(eq(purchaseInvoicesTable.id, id), eq(purchaseInvoicesTable.shopId, shopId)),
    );
  if (!invoice) {
    res.status(404).json({ error: "ইনভয়েস পাওয়া যায়নি" });
    return;
  }

  const items = await db
    .select()
    .from(purchaseInvoiceItemsTable)
    .where(eq(purchaseInvoiceItemsTable.invoiceId, invoice.id));

  res.json(serializeInvoice(invoice, items));
});

/**
 * User confirmation step: applies the (possibly edited) lines to inventory —
 * matched products get stock added and cost updated, "new" lines create a
 * product, skipped lines change nothing. All in one transaction.
 */
router.post("/purchases/:id/confirm", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "manager");
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid invoice id" });
    return;
  }
  const parsed = ConfirmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(purchaseInvoicesTable)
      .where(
        and(
          eq(purchaseInvoicesTable.id, id),
          eq(purchaseInvoicesTable.shopId, ctx.shopId),
        ),
      );
    if (!invoice) throw new RouteError(404, "ইনভয়েস পাওয়া যায়নি");
    if (invoice.status === "confirmed") {
      throw new RouteError(409, "এই ইনভয়েস আগেই নিশ্চিত করা হয়েছে");
    }

    let updated = 0;
    let created = 0;

    for (const line of parsed.data.items) {
      if (line.skip) continue;

      if (line.productId) {
        const [product] = await tx
          .select()
          .from(productsTable)
          .where(
            and(
              eq(productsTable.id, line.productId),
              eq(productsTable.shopId, ctx.shopId),
            ),
          );
        if (!product) throw new RouteError(400, "পণ্য পাওয়া যায়নি");

        await tx
          .update(productsTable)
          .set({
            stock: String(toNum(product.stock) + line.quantity),
            ...(line.unitCost != null ? { costPrice: String(line.unitCost) } : {}),
          })
          .where(eq(productsTable.id, product.id));
        updated++;
        continue;
      }

      if (line.createNew) {
        await tx.insert(productsTable).values({
          shopId: ctx.shopId,
          userId: ctx.userId,
          name: line.name,
          category: line.category ?? "সাধারণ",
          unit: line.unit ?? "পিস",
          price: String(line.sellPrice ?? line.unitCost ?? 0),
          costPrice: line.unitCost != null ? String(line.unitCost) : null,
          stock: String(line.quantity),
        });
        created++;
      }
    }

    const [row] = await tx
      .update(purchaseInvoicesTable)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        supplierName: parsed.data.supplierName ?? invoice.supplierName,
      })
      .where(eq(purchaseInvoicesTable.id, invoice.id))
      .returning();

    return { row, updated, created };
  });

  res.json({
    id: result.row.id,
    status: result.row.status,
    updatedProducts: result.updated,
    createdProducts: result.created,
  });
});

export default router;
