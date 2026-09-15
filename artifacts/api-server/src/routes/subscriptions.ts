import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  SUBSCRIPTION_PLANS,
  db,
  shopsTable,
  subscriptionsTable,
} from "@workspace/db";
import { requireRole, requireShop } from "../lib/tenant";

const router: IRouter = Router();

/**
 * Plan catalogue. Prices are in BDT/month and informational only — no payment
 * is taken and no SKU/product limits are enforced yet.
 */
const PLAN_CATALOG = [
  {
    id: "free",
    name: "ফ্রি (Free)",
    price: 0,
    features: [
      "১ টি দোকান",
      "সর্বোচ্চ ৫০ টি পণ্য",
      "সর্বোচ্চ ২ জন সদস্য",
      "ডিজিটাল বিলিং ও কাস্টমার বাকির খাতা",
    ],
  },
  {
    id: "basic",
    name: "বেসিক",
    price: 199,
    features: [
      "১ টি দোকান",
      "সর্বোচ্চ ৫০০ টি পণ্য",
      "সর্বোচ্চ ৩ জন সদস্য",
      "বিলিং, ইনভেন্টরি ও বাকির খাতা",
      "ক্যাশবাক্স ট্রেডিশনাল হিসাব",
    ],
  },
  {
    id: "standard",
    name: "স্ট্যান্ডার্ড",
    price: 499,
    features: [
      "সর্বোচ্চ ৩ টি দোকান",
      "সর্বোচ্চ ৫,০০০ টি পণ্য",
      "সর্বোচ্চ ১০ জন সদস্য",
      "বারকোড স্ক্যান ও মাস্টার পণ্য তালিকা",
      "ক্যাশ বক্স ও বিস্তৃত রিপোর্ট",
    ],
  },
  {
    id: "premium",
    name: "প্রিমিয়াম",
    price: 999,
    features: [
      "সর্বোচ্চ ১০ টি দোকান",
      "সর্বোচ্চ ৫০,০০০ টি পণ্য",
      "সর্বোচ্চ ৫০ জন সদস্য",
      "ছোটু AI ভয়েস এসিস্ট্যান্ট",
      "স্মার্ট ওসিআর ইনভয়েস স্ক্যান",
    ],
  },
  {
    id: "organization",
    name: "অর্গানাইজেশন (সুপারশপ/চেইন)",
    price: null,
    features: [
      "আনলিমিটেড দোকান / ব্রাঞ্চ",
      "আনলিমিটেড পণ্য ও কর্মী",
      "কেন্দ্রীয় এন্টারপ্রাইজ রিপোর্ট",
      "২৪/৭ প্রিমিয়াম কাস্টমার সাপোর্ট",
    ],
  },
] as const;

const SelectPlanBody = z.object({ plan: z.enum(SUBSCRIPTION_PLANS) });

/** Plan catalogue + the shop's current plan and history. */
router.get("/subscription", async (req, res): Promise<void> => {
  const ctx = requireShop(req);
  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, ctx.shopId));

  const history = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.shopId, ctx.shopId))
    .orderBy(desc(subscriptionsTable.startedAt))
    .limit(20);

  res.json({
    plans: PLAN_CATALOG,
    currentPlan: shop?.subscriptionPlan ?? "basic",
    role: ctx.role,
    history: history.map((row) => ({
      id: row.id,
      plan: row.plan,
      status: row.status,
      startedAt: row.startedAt.toISOString(),
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    })),
  });
});

/**
 * Records a plan selection. Payment is intentionally not implemented — the
 * plan is stored so the panel reflects the choice.
 */
router.post("/subscription", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "admin");
  const parsed = SelectPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const row = await db.transaction(async (tx) => {
    await tx
      .update(subscriptionsTable)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(subscriptionsTable.shopId, ctx.shopId),
          eq(subscriptionsTable.status, "active"),
        ),
      );

    const [created] = await tx
      .insert(subscriptionsTable)
      .values({
        shopId: ctx.shopId,
        organizationId: ctx.organizationId,
        plan: parsed.data.plan,
        selectedByUserId: ctx.userId,
      })
      .returning();

    await tx
      .update(shopsTable)
      .set({ subscriptionPlan: parsed.data.plan })
      .where(eq(shopsTable.id, ctx.shopId));

    return created;
  });

  res.status(201).json({
    id: row.id,
    plan: row.plan,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    paymentRequired: false,
  });
});

export default router;
