import {
  boolean,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("products_user_id_barcode_unique").on(
      table.userId,
      table.barcode
    ),
  ]
);

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;