import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

/**
 * Shop categories drive terminology, starter catalogue and the subtle accent
 * theme on the frontend. Keep this list in sync with
 * `artifacts/dokandar-mama/src/lib/shop-categories.ts`.
 */
export const SHOP_CATEGORIES = [
  "mudi",
  "pharmacy",
  "clothing",
  "accessories",
  "cosmetics",
  "super_shop",
  "general",
  "electronics",
  "stationery",
  "hardware",
  "restaurant",
  "other",
] as const;
export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

export const SUBSCRIPTION_PLANS = [
  "free",
  "basic",
  "standard",
  "premium",
  "organization",
] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

/**
 * A shop is the tenant boundary for every piece of transactional data
 * (products, customers, sales, ledger, cashbox). A shop may belong to an
 * organization (chain / super shop) — then the organization can read
 * aggregated data across its shops, but each shop's operational data stays
 * its own.
 */
export const shopsTable = pgTable("shops", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(
    () => organizationsTable.id,
    { onDelete: "set null" },
  ),
  name: text("name").notNull(),
  category: text("category", { enum: SHOP_CATEGORIES })
    .notNull()
    .default("mudi"),
  // Clerk user ID of the shop owner (always has the `admin` role in shop_users).
  ownerUserId: text("owner_user_id").notNull(),
  ownerName: text("owner_name"),
  area: text("area"),
  subscriptionPlan: text("subscription_plan", { enum: SUBSCRIPTION_PLANS })
    .notNull()
    .default("basic"),
  cashboxAddon: boolean("cashbox_addon").notNull().default(false),
  enabledPaymentMethods: text("enabled_payment_methods").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({
  id: true,
  ownerUserId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;
