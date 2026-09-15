import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";

/**
 * Role names, ordered from most to least privileged. Authorization is always
 * enforced server-side (see api-server's `lib/tenant.ts`); the frontend only
 * hides controls as a convenience.
 */
export const SHOP_ROLES = ["admin", "manager", "shopkeeper"] as const;
export type ShopRole = (typeof SHOP_ROLES)[number];

export const SHOP_USER_STATUS = ["active", "pending", "revoked", "expired"] as const;
export type ShopUserStatus = (typeof SHOP_USER_STATUS)[number];

/** Membership of a Clerk user in a shop, with their role in that shop. */
export const shopUsersTable = pgTable(
  "shop_users",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    name: text("name"),
    email: text("email"),
    role: text("role", { enum: SHOP_ROLES }).notNull().default("shopkeeper"),
    status: text("status", { enum: SHOP_USER_STATUS }).notNull().default("active"),
    invitedBy: text("invited_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique("shop_users_shop_id_user_id_key").on(table.shopId, table.userId)],
);

export const insertShopUserSchema = createInsertSchema(shopUsersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertShopUser = z.infer<typeof insertShopUserSchema>;
export type ShopUser = typeof shopUsersTable.$inferSelect;
