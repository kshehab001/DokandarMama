import { numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  // Clerk user ID of the shopkeeper who owns this customer record.
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  bakiBalance: numeric("baki_balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
