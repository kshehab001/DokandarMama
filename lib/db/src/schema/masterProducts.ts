import {
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Global (cross-shop) product catalogue keyed by barcode. Shops never write
 * here — it only feeds barcode auto-recognition when adding a product, so a
 * scan can pre-fill name/brand/unit/price instead of typing everything.
 */
export const masterProductsTable = pgTable(
  "master_products",
  {
    id: serial("id").primaryKey(),
    barcode: text("barcode").notNull(),
    name: text("name").notNull(),
    nameBn: text("name_bn"),
    brand: text("brand"),
    category: text("category"),
    unit: text("unit"),
    defaultPrice: numeric("default_price", { precision: 12, scale: 2 }),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("master_products_barcode_key").on(table.barcode)],
);

export const insertMasterProductSchema = createInsertSchema(
  masterProductsTable,
).omit({ id: true, createdAt: true });
export type InsertMasterProduct = z.infer<typeof insertMasterProductSchema>;
export type MasterProduct = typeof masterProductsTable.$inferSelect;
