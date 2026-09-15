import type { Request } from "express";
import { type ShopRole } from "@workspace/db";
import { getUserId } from "./auth";
import { RouteError } from "./numeric";
import { requireShop, type ShopContext } from "./tenant";

export type SystemRole = ShopRole | "superadmin";

export const ROLE_HIERARCHY: Record<ShopRole, number> = {
  admin: 3, // Owner
  manager: 2, // Store Manager
  shopkeeper: 1, // Sales / Cashier Staff
};

export type ResourceAction =
  | "view_billing"
  | "create_sale"
  | "view_products"
  | "view_cost_price"
  | "manage_products"
  | "delete_products"
  | "view_customers"
  | "manage_customers"
  | "delete_customers"
  | "view_cashbox"
  | "manage_cashbox_movements"
  | "close_cashbox_session"
  | "view_cashbox_sessions"
  | "manage_purchases"
  | "view_reports"
  | "manage_shop_settings"
  | "manage_team"
  | "manage_subscriptions"
  | "access_super_admin";

const ROLE_PERMISSIONS: Record<ShopRole, ResourceAction[]> = {
  admin: [
    "view_billing",
    "create_sale",
    "view_products",
    "view_cost_price",
    "manage_products",
    "delete_products",
    "view_customers",
    "manage_customers",
    "delete_customers",
    "view_cashbox",
    "manage_cashbox_movements",
    "close_cashbox_session",
    "view_cashbox_sessions",
    "manage_purchases",
    "view_reports",
    "manage_shop_settings",
    "manage_team",
    "manage_subscriptions",
  ],
  manager: [
    "view_billing",
    "create_sale",
    "view_products",
    "view_cost_price",
    "manage_products",
    "delete_products",
    "view_customers",
    "manage_customers",
    "view_cashbox",
    "manage_cashbox_movements",
    "close_cashbox_session",
    "view_cashbox_sessions",
    "manage_purchases",
    "view_reports",
  ],
  shopkeeper: [
    "view_billing",
    "create_sale",
    "view_products",
    "view_customers",
    "manage_customers",
    "view_cashbox",
    "manage_cashbox_movements",
  ],
};

/**
 * Checks if a shop role has permission for a specific action.
 */
export function hasPermission(role: ShopRole, action: ResourceAction): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

/**
 * Enforces that the caller has permission for an action, throwing 403 otherwise.
 */
export function requirePermission(req: Request, action: ResourceAction): ShopContext {
  const ctx = requireShop(req);
  if (!hasPermission(ctx.role, action)) {
    throw new RouteError(403, `এই কাজটি করার অনুমতি আপনার নেই (প্রয়োজন: ${action})`);
  }
  return ctx;
}

/**
 * Platform administration is deliberately separate from shop membership.
 *
 * Only immutable Clerk user IDs configured on the server may grant this
 * capability. Request headers and email-address heuristics are client
 * controlled (or mutable) and must never authorize cross-tenant access.
 */
export function isSuperAdminUser(userId: string): boolean {
  const superAdminUserIds = (process.env.SUPER_ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return superAdminUserIds.includes(userId);
}

/**
 * Enforces super-admin access.
 */
export function requireSuperAdmin(req: Request): { userId: string } {
  const userId = getUserId(req);
  if (!isSuperAdminUser(userId)) {
    throw new RouteError(403, "প্ল্যাটফর্ম সুপার অ্যাডমিন অ্যাক্সেস প্রয়োজন");
  }
  return { userId };
}
