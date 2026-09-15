import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { shopsTable } from "./shops";

export const salesTable = pgTable(
  "sales",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id").references(() => shopsTable.id, {
      onDelete: "cascade",
    }),
    // Clerk user ID of the shopkeeper who made this sale.
    userId: text("user_id").notNull(),
    customerId: integer("customer_id").references(() => customersTable.id, {
      onDelete: "set null",
    }),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull(),
    dueAmount: numeric("due_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    paymentMethod: text("payment_method", {
      enum: ["cash", "baki", "mixed", "digital"],
    }).notNull(),
    digitalProvider: text("digital_provider"),
    digitalTrxId: text("digital_trx_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_sales_shop_created").on(table.shopId, table.createdAt),
    index("idx_sales_shop_customer").on(table.shopId, table.customerId),
  ],
);

export const insertSaleSchema = createInsertSchema(salesTable).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;

export const saleItemsTable = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => salesTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const insertSaleItemSchema = createInsertSchema(saleItemsTable).omit({
  id: true,
});
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItemsTable.$inferSelect;


