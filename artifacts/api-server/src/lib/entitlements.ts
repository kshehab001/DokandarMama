import { count, eq } from "drizzle-orm";
import {
  db,
  productsTable,
  shopUsersTable,
  shopsTable,
  type SubscriptionPlan,
} from "@workspace/db";
import { RouteError } from "./numeric";

export interface PlanLimits {
  maxShops: number;
  maxMembers: number;
  maxProducts: number;
}

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxShops: 1,
    maxMembers: 2,
    maxProducts: 50,
  },
  basic: {
    maxShops: 1,
    maxMembers: 3,
    maxProducts: 500,
  },
  standard: {
    maxShops: 3,
    maxMembers: 10,
    maxProducts: 5000,
  },
  premium: {
    maxShops: 10,
    maxMembers: 50,
    maxProducts: 50000,
  },
  organization: {
    maxShops: Infinity,
    maxMembers: Infinity,
    maxProducts: Infinity,
  },
};

export async function assertCanCreateShop(userId: string): Promise<void> {
  // Find all shops owned by user
  const ownedShops = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.ownerUserId, userId));

  if (ownedShops.length === 0) {
    // First shop creation is always allowed
    return;
  }

  // Find the highest plan across all owned shops
  let maxAllowedShops = 1;
  for (const shop of ownedShops) {
    const plan = (shop.subscriptionPlan || "free") as SubscriptionPlan;
    const limit = PLAN_ENTITLEMENTS[plan]?.maxShops ?? 1;
    if (limit > maxAllowedShops) {
      maxAllowedShops = limit;
    }
  }

  if (ownedShops.length >= maxAllowedShops) {
    throw new RouteError(
      403,
      `আপনার বর্তমান প্ল্যানে সর্বোচ্চ ${maxAllowedShops} টি দোকান তৈরি করা সম্ভব। আরও দোকান তৈরি করতে সাবস্ক্রিপশন আপডেট করুন।`,
    );
  }
}

export async function assertCanAddMember(shopId: number): Promise<void> {
  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, shopId));

  if (!shop) return;

  const plan = (shop.subscriptionPlan || "free") as SubscriptionPlan;
  const maxMembers = PLAN_ENTITLEMENTS[plan]?.maxMembers ?? 2;

  const [{ currentCount }] = await db
    .select({ currentCount: count() })
    .from(shopUsersTable)
    .where(eq(shopUsersTable.shopId, shopId));

  if (currentCount >= maxMembers) {
    throw new RouteError(
      403,
      `আপনার ${plan.toUpperCase()} প্ল্যানে সর্বোচ্চ ${maxMembers} জন স্টাফ যোগ করা সম্ভব। নতুন সদস্য যোগ করতে আপগ্রেড করুন।`,
    );
  }
}

export async function assertCanAddProduct(shopId: number): Promise<void> {
  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, shopId));

  if (!shop) return;

  const plan = (shop.subscriptionPlan || "free") as SubscriptionPlan;
  const maxProducts = PLAN_ENTITLEMENTS[plan]?.maxProducts ?? 50;

  const [{ currentCount }] = await db
    .select({ currentCount: count() })
    .from(productsTable)
    .where(eq(productsTable.shopId, shopId));

  if (currentCount >= maxProducts) {
    throw new RouteError(
      403,
      `আপনার ${plan.toUpperCase()} প্ল্যানে সর্বোচ্চ ${maxProducts} টি প্রোডাক্ট যোগ করা সম্ভব। আরও প্রোডাক্ট যুক্ত করতে আপগ্রেড করুন।`,
    );
  }
}
