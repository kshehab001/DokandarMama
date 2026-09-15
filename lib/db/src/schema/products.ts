import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { masterProductsTable } from "./masterProducts";

export const productsTable = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    // Tenant boundary: the shop this row belongs to. Nullable only so existing
    // pre-multi-tenant rows can be backfilled on first shop creation; the API
    // layer always writes it and always filters on it.
    shopId: integer("shop_id").references(() => shopsTable.id, {
      onDelete: "cascade",
    }),
    // Clerk user ID of the shopkeeper who owns this product. Every query in
    // the API layer must filter/insert on this column — see api-server's
    // requireAuth + getUserId. Without it, all shopkeepers share one catalog.
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    barcode: text("barcode"),
    category: text("category").notNull(),
    unit: text("unit").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
    stock: numeric("stock", { precision: 12, scale: 3 }).notNull().default("0"),
    lowStockThreshold: numeric("low_stock_threshold", {
      precision: 12,
      scale: 3,
    })
      .notNull()
      .default("5"),
    isPriceVariable: boolean("is_price_variable").notNull().default(false),
    // Category-specific attributes
    mfgDate: timestamp("mfg_date", { withTimezone: true }),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    batchNumber: text("batch_number"),
    brand: text("brand"),
    warranty: text("warranty"),
    size: text("size"),
    color: text("color"),
    // Link to the global barcode catalogue when the item came from a scan.
    masterProductId: integer("master_product_id").references(
      () => masterProductsTable.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Barcode uniqueness is scoped to the shop — same barcode may exist in
    // different shops, but duplicates within one shop are rejected.
    // Partial index excludes NULL barcodes so products without barcodes are fine.
    uniqueIndex("products_shop_id_barcode_unique")
      .on(table.shopId, table.barcode)
      .where(sql`${table.barcode} IS NOT NULL`),
  ],
);

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  userId: true,
  shopId: true,
  masterProductId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
