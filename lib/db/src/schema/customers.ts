import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  // Tenant boundary: the shop this row belongs to. Nullable only so existing
  // pre-multi-tenant rows can be backfilled on first shop creation; the API
  // layer always writes it and always filters on it.
  shopId: integer("shop_id").references(() => shopsTable.id, {
    onDelete: "cascade",
  }),
  // Clerk user ID of the shopkeeper who owns this customer record.
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  bakiBalance: numeric("baki_balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  // Phone verification (item 10). Nullable/defaulted so existing rows stay valid.
  phoneVerified: boolean("phone_verified").notNull().default(false),
  verificationCode: text("verification_code"),
  verificationSentAt: timestamp("verification_sent_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({
  id: true,
  userId: true,
  shopId: true,
  phoneVerified: true,
  verificationCode: true,
  verificationSentAt: true,
  verifiedAt: true,
  createdAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
