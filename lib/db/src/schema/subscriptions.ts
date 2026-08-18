import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { shopsTable, SUBSCRIPTION_PLANS } from "./shops";

export const SUBSCRIPTION_STATUS = ["active", "cancelled", "expired"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

/**
 * Plan selection history. Payments are NOT implemented yet — a row here only
 * records which plan a shop/organization chose and when.
 */
export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shopsTable.id, {
    onDelete: "cascade",
  }),
  organizationId: integer("organization_id").references(
    () => organizationsTable.id,
    { onDelete: "cascade" },
  ),
  plan: text("plan", { enum: SUBSCRIPTION_PLANS }).notNull().default("basic"),
  status: text("status", { enum: SUBSCRIPTION_STATUS })
    .notNull()
    .default("active"),
  selectedByUserId: text("selected_by_user_id"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type Subscription = typeof subscriptionsTable.$inferSelect;
