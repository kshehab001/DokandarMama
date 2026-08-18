import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { productsTable } from "./products";

export const PURCHASE_INVOICE_STATUS = [
  "uploaded",
  "parsed",
  "confirmed",
  "failed",
] as const;
export type PurchaseInvoiceStatus = (typeof PURCHASE_INVOICE_STATUS)[number];

/** A supplier invoice photo, its OCR result and the stock update it produced. */
export const purchaseInvoicesTable = pgTable("purchase_invoices", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shopsTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url"),
  supplierName: text("supplier_name"),
  invoiceTotal: numeric("invoice_total", { precision: 12, scale: 2 }),
  status: text("status", { enum: PURCHASE_INVOICE_STATUS })
    .notNull()
    .default("uploaded"),
  rawOcrText: text("raw_ocr_text"),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
});

export const PURCHASE_ITEM_STATUS = [
  "pending",
  "matched",
  "new",
  "skipped",
] as const;
export type PurchaseItemStatus = (typeof PURCHASE_ITEM_STATUS)[number];

export const purchaseInvoiceItemsTable = pgTable("purchase_invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => purchaseInvoicesTable.id, { onDelete: "cascade" }),
  rawText: text("raw_text"),
  matchedProductId: integer("matched_product_id").references(
    () => productsTable.id,
    { onDelete: "set null" },
  ),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 })
    .notNull()
    .default("0"),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }),
  status: text("status", { enum: PURCHASE_ITEM_STATUS })
    .notNull()
    .default("pending"),
});

export type PurchaseInvoice = typeof purchaseInvoicesTable.$inferSelect;
export type PurchaseInvoiceItem =
  typeof purchaseInvoiceItemsTable.$inferSelect;
export const purchaseItemStatusSchema = z.enum(PURCHASE_ITEM_STATUS);
