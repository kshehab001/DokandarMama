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
    id: "basic",
    name: "বেসিক",
    price: 0,
    features: [
      "একটি দোকান",
      "বিলিং, ইনভেন্টরি ও বাকির খাতা",
      "বেসিক রিপোর্ট",
    ],
  },
  {
    id: "standard",
    name: "স্ট্যান্ডার্ড",
    price: 399,
    features: [
      "বারকোড স্ক্যান ও মাস্টার পণ্য তালিকা",
      "ক্যাশ বক্স ও খরচের হিসাব",
      "রিপোর্ট ডাউনলোড",
    ],
  },
  {
    id: "premium",
    name: "প্রিমিয়াম",
    price: 699,
    features: [
      "স্ট্যান্ডার্ডের সব সুবিধা",
      "ইনভয়েস ছবি থেকে স্টক আপডেট (OCR)",
      "ভয়েস অ্যাসিস্ট্যান্ট ও কর্মচারী রোল",
    ],
  },
  {
    id: "organization",
    name: "অর্গানাইজেশন",
    price: null,
    features: [
      "সুপারশপ / চেইন শপ",
      "একাধিক ব্রাঞ্চ ও কেন্দ্রীয় রিপোর্ট",
      "কাস্টম মূল্য — যোগাযোগ করুন",
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
