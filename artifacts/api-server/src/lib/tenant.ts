import type { NextFunction, Request, Response } from "express";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import {
  customersTable,
  db,
  ledgerEntriesTable,
  productsTable,
  salesTable,
  shopUsersTable,
  shopsTable,
  type ShopRole,
} from "@workspace/db";
import { getUserId } from "./auth";
import { RouteError } from "./numeric";
import { getClerkUserPrimaryEmail } from "./clerk";

export interface ShopContext {
  shopId: number;
  organizationId: number | null;
  role: ShopRole;
  userId: string;
}

/**
 * Per-request tenant context. Kept in a WeakMap rather than on `req` so the
 * boundary can only be read through `requireShop`/`requireRole` below — a
 * route can't accidentally reach around it.
 */
const shopContexts = new WeakMap<Request, ShopContext>();

const ROLE_RANK: Record<ShopRole, number> = {
  admin: 3,
  manager: 2,
  shopkeeper: 1,
};

/**
 * Resolves which shop the request acts on, **server-side only**.
 *
 * The client may *suggest* a shop with the `x-shop-id` header (used by chain
 * shops to switch between branches), but the suggestion is only honoured when
 * the authenticated Clerk user actually has an active `shop_users` membership.
 */
export async function resolveShopContext(
  req: Request,
): Promise<ShopContext | null> {
  const userId = getUserId(req);

  let memberships = await db
    .select({
      shopId: shopUsersTable.shopId,
      role: shopUsersTable.role,
      organizationId: shopsTable.organizationId,
    })
    .from(shopUsersTable)
    .innerJoin(shopsTable, eq(shopsTable.id, shopUsersTable.shopId))
    .where(
      and(
        eq(shopUsersTable.userId, userId),
        ne(shopUsersTable.status, "revoked"),
      ),
    );

  // Auto-claim pending email invitations upon user authentication
  if (memberships.length === 0) {
    const userEmail = await getClerkUserPrimaryEmail(userId);
    if (userEmail) {
      const [pendingInv] = await db
        .select()
        .from(shopUsersTable)
        .where(
          and(
            sql`LOWER(${shopUsersTable.email}) = LOWER(${userEmail})`,
            eq(shopUsersTable.status, "pending"),
          ),
        );

      if (pendingInv) {
        await db
          .update(shopUsersTable)
          .set({
            userId,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(shopUsersTable.id, pendingInv.id));

        memberships = await db
          .select({
            shopId: shopUsersTable.shopId,
            role: shopUsersTable.role,
            organizationId: shopsTable.organizationId,
          })
          .from(shopUsersTable)
          .innerJoin(shopsTable, eq(shopsTable.id, shopUsersTable.shopId))
          .where(
            and(
              eq(shopUsersTable.userId, userId),
              ne(shopUsersTable.status, "revoked"),
            ),
          );
      }
    }
  }

  if (memberships.length === 0) return null;

  const requested = Number(req.header("x-shop-id"));
  const chosen =
    (Number.isInteger(requested) &&
      memberships.find((m) => m.shopId === requested)) ||
    memberships[0];

  return {
    shopId: chosen.shopId,
    organizationId: chosen.organizationId,
    role: chosen.role,
    userId,
  };
}

/**
 * Express middleware: attaches `req.shop` when the user belongs to a shop.
 * Deliberately does NOT reject membership-less users — the onboarding routes
 * (`/shops`) must stay reachable so a brand new user can create their shop.
 */
export async function withShopContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = await resolveShopContext(req);
    if (ctx) shopContexts.set(req, ctx);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Every route touching shop data must call this instead of `getUserId` —
 * it is the tenant boundary. Throws (409) when the user has not completed
 * shop onboarding yet, so a missing shop can never widen a query.
 */
export function requireShop(req: Request): ShopContext {
  const ctx = shopContexts.get(req);
  if (!ctx) {
    throw new RouteError(409, "SHOP_ONBOARDING_REQUIRED");
  }
  return ctx;
}

/** Throws 403 unless the caller's role in the current shop is high enough. */
export function requireRole(req: Request, minimum: ShopRole): ShopContext {
  const ctx = requireShop(req);
  if (ROLE_RANK[ctx.role] < ROLE_RANK[minimum]) {
    throw new RouteError(403, "এই কাজটি করার অনুমতি আপনার নেই");
  }
  return ctx;
}

export function hasRole(ctx: ShopContext, minimum: ShopRole): boolean {
  return ROLE_RANK[ctx.role] >= ROLE_RANK[minimum];
}

/**
 * All shop IDs the caller may read aggregated data for: their own shop, plus
 * every sibling branch when they are an admin of an organization shop.
 */
export async function organizationShopIds(ctx: ShopContext): Promise<number[]> {
  if (!ctx.organizationId || ctx.role !== "admin") return [ctx.shopId];
  const rows = await db
    .select({ id: shopsTable.id })
    .from(shopsTable)
    .where(eq(shopsTable.organizationId, ctx.organizationId));
  return rows.map((r) => r.id);
}

/**
 * One-time backfill run when a user creates their first shop: the rows they
 * created before shops existed carry `shop_id = null`, and would otherwise
 * become invisible once every query filters on shop_id.
 */
export async function claimLegacyRowsForShop(
  userId: string,
  shopId: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const table of [
      productsTable,
      customersTable,
      salesTable,
      ledgerEntriesTable,
    ]) {
      await tx
        .update(table)
        .set({ shopId })
        .where(and(eq(table.userId, userId), isNull(table.shopId)));
    }
  });
}
