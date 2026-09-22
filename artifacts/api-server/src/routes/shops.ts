import { Router, type IRouter } from "express";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import {
  SHOP_CATEGORIES,
  SHOP_ROLES,
  SUBSCRIPTION_PLANS,
  db,
  organizationsTable,
  shopUsersTable,
  shopsTable,
} from "@workspace/db";
import { getUserId } from "../lib/auth";
import { RouteError } from "../lib/numeric";
import {
  claimLegacyRowsForShop,
  requireRole,
  requireShop,
  resolveShopContext,
} from "../lib/tenant";
import { assertCanAddMember, assertCanCreateShop } from "../lib/entitlements";
import { sendClerkInvitation } from "../lib/clerk";

const router: IRouter = Router();

const CreateShopBody = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(SHOP_CATEGORIES),
  ownerName: z.string().trim().max(120).optional(),
  area: z.string().trim().max(120).optional(),
  enabledPaymentMethods: z.array(z.string()).optional(),
  /** Present when the owner is registering a chain / super shop. */
  organizationName: z.string().trim().max(120).optional(),
});

const UpdateShopBody = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  category: z.enum(SHOP_CATEGORIES).optional(),
  ownerName: z.string().trim().max(120).optional(),
  area: z.string().trim().max(120).optional(),
  subscriptionPlan: z.enum(SUBSCRIPTION_PLANS).optional(),
  cashboxAddon: z.boolean().optional(),
  enabledPaymentMethods: z.array(z.string()).optional(),
});

const AddMemberBody = z
  .object({
    userId: z.string().trim().max(120).optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    name: z.string().trim().max(120).optional(),
    role: z.enum(SHOP_ROLES),
  })
  .refine((d) => d.userId || (d.email && d.email.length > 0) || d.name, {
    message: "কর্মীর নাম, ইমেইল অথবা ইউজার আইডি দিতে হবে",
  });

function serializeShop(row: typeof shopsTable.$inferSelect) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    category: row.category,
    ownerName: row.ownerName,
    area: row.area,
    subscriptionPlan: row.subscriptionPlan,
    cashboxAddon: row.cashboxAddon,
    enabledPaymentMethods: row.enabledPaymentMethods || ["bkash", "nagad"],
    createdAt: row.createdAt.toISOString(),
  };
}

/** Every shop the signed-in user is a member of, with their role in each. */
router.get("/shops", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  // Auto-claim any pending invites for this user's email or phone first
  await resolveShopContext(req);

  const rows = await db
    .select({ shop: shopsTable, role: shopUsersTable.role })
    .from(shopUsersTable)
    .innerJoin(shopsTable, eq(shopsTable.id, shopUsersTable.shopId))
    .where(
      and(
        eq(shopUsersTable.userId, userId),
        ne(shopUsersTable.status, "revoked"),
      ),
    )
    .orderBy(shopsTable.id);

  res.json(rows.map((r) => ({ ...serializeShop(r.shop), role: r.role })));
});

/**
 * The shop the API will act on for this user (honours `x-shop-id` when the
 * user is a member of it). Returns `{ shop: null }` — not an error — when the
 * user has not completed onboarding, so the frontend can show the gate.
 */
router.get("/shops/current", async (req, res): Promise<void> => {
  const ctx = await resolveShopContext(req);
  if (!ctx) {
    res.json({ shop: null, role: null, organization: null });
    return;
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, ctx.shopId));

  const organization = ctx.organizationId
    ? (
        await db
          .select()
          .from(organizationsTable)
          .where(eq(organizationsTable.id, ctx.organizationId))
      )[0]
    : null;

  res.json({
    shop: serializeShop(shop),
    role: ctx.role,
    organization: organization
      ? { id: organization.id, name: organization.name }
      : null,
  });
});

/** Shop onboarding — creates the shop, makes the creator its admin. */
router.post("/shops", async (req, res): Promise<void> => {
  const parsed = CreateShopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getUserId(req);
  const { name, category, ownerName, area, organizationName } = parsed.data;

  const isFirstShop = (await resolveShopContext(req)) === null;
  if (!isFirstShop) {
    await assertCanCreateShop(userId);
  }

  const shop = await db.transaction(async (tx) => {
    let organizationId: number | null = null;
    if (organizationName) {
      const [org] = await tx
        .insert(organizationsTable)
        .values({ name: organizationName, ownerUserId: userId })
        .returning();
      organizationId = org.id;
    }

    const [created] = await tx
      .insert(shopsTable)
      .values({
        name,
        category,
        organizationId,
        ownerUserId: userId,
        ownerName: ownerName ?? null,
        area: area ?? null,
        subscriptionPlan: organizationName ? "organization" : "basic",
        enabledPaymentMethods: parsed.data.enabledPaymentMethods ?? ["bkash", "nagad"],
      })
      .returning();

    await tx.insert(shopUsersTable).values({
      shopId: created.id,
      userId,
      name: ownerName ?? null,
      role: "admin",
    });

    return created;
  });

  // Rows created before shops existed carry shop_id = null; attach them to the
  // owner's first shop so nothing disappears once queries filter on shop_id.
  if (isFirstShop) {
    await claimLegacyRowsForShop(userId, shop.id);
  }

  res.status(201).json(serializeShop(shop));
});

/** Adds a branch to the caller's organization (chain shops). */
router.post("/shops/branches", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "admin");
  const parsed = CreateShopBody.omit({ organizationName: true }).safeParse(
    req.body,
  );
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let organizationId = ctx.organizationId;
  const shop = await db.transaction(async (tx) => {
    if (!organizationId) {
      // First branch: promote the existing single shop into an organization.
      const [current] = await tx
        .select()
        .from(shopsTable)
        .where(eq(shopsTable.id, ctx.shopId));
      const [org] = await tx
        .insert(organizationsTable)
        .values({ name: current.name, ownerUserId: ctx.userId })
        .returning();
      organizationId = org.id;
      await tx
        .update(shopsTable)
        .set({ organizationId })
        .where(eq(shopsTable.id, ctx.shopId));
    }

    const [created] = await tx
      .insert(shopsTable)
      .values({
        name: parsed.data.name,
        category: parsed.data.category,
        organizationId,
        ownerUserId: ctx.userId,
        ownerName: parsed.data.ownerName ?? null,
        area: parsed.data.area ?? null,
        subscriptionPlan: "organization",
      })
      .returning();

    await tx
      .insert(shopUsersTable)
      .values({ shopId: created.id, userId: ctx.userId, role: "admin" });

    return created;
  });

  res.status(201).json(serializeShop(shop));
});

/** Shop settings — admin only. */
router.patch("/shops/current", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "admin");
  const parsed = UpdateShopBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(shopsTable)
    .set(parsed.data)
    .where(eq(shopsTable.id, ctx.shopId))
    .returning();

  res.json(serializeShop(row));
});

/** Team management — admin only. */
router.get("/shops/current/members", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "manager");
  const rows = await db
    .select()
    .from(shopUsersTable)
    .where(eq(shopUsersTable.shopId, ctx.shopId))
    .orderBy(shopUsersTable.id);

  const rawOrigin = req.header("origin") || req.header("referer");
  let origin = rawOrigin ? new URL(rawOrigin).origin : null;
  if (!origin || origin.includes("localhost") || origin.includes("capacitor://")) {
    origin = process.env.PUBLIC_APP_URL || process.env.APP_URL || "https://dokandar-mama.onrender.com";
  }

  res.json(
    rows.map((r) => {
      let inviteCode: string | null = null;
      if (r.status === "pending") {
        if (r.userId.startsWith("inv_")) {
          inviteCode = r.userId.replace("inv_", "");
        } else if (r.userId.startsWith("clerk_inv_")) {
          inviteCode = `INV-${r.userId.slice(-6).toUpperCase()}`;
        } else if (r.userId.startsWith("invited_")) {
          inviteCode = `INV-${r.userId.slice(-6).toUpperCase()}`;
        } else {
          inviteCode = `INV-${String(r.id).padStart(4, "0")}`;
        }
      }
      return {
        id: r.id,
        userId: r.userId,
        email: r.email,
        name: r.name,
        role: r.role,
        status: r.status,
        inviteCode,
        joinUrl: inviteCode ? `${origin.replace(/\/$/, "")}/app?invite=${encodeURIComponent(inviteCode)}` : null,
        invitedBy: r.invitedBy,
        createdAt: r.createdAt.toISOString(),
      };
    }),
  );
});

router.post("/shops/current/members", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "admin");
  const parsed = AddMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.role === "admin") {
    throw new RouteError(403, "অ্যাডমিন বা মালিক রোল যোগ করা যাবে না। শুধুমাত্র ম্যানেজার ও দোকানদার যোগ করা যাবে।");
  }

  await assertCanAddMember(ctx.shopId);

  // Generate a clean 6-digit invite code (e.g. INV-849201)
  const rawCode = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

  const rawOrigin = req.header("origin") || req.header("referer");
  let origin = rawOrigin ? new URL(rawOrigin).origin : null;
  // Never pass localhost/capacitor scheme to Clerk
  if (!origin || origin.includes("localhost") || origin.includes("capacitor://")) {
    origin = process.env.PUBLIC_APP_URL || process.env.APP_URL || "https://dokandar-mama.onrender.com";
  }
  // Embed invite code in the redirect so the employee lands on /app?invite=INV-XXXXXX
  // after completing Clerk sign-up — the ShopOnboardingGate auto-detects this URL param.
  const joinUrl = `${origin.replace(/\/$/, "")}/app?invite=${encodeURIComponent(rawCode)}`;
  const redirectUrl = `${origin.replace(/\/$/, "")}/sign-up?redirect_url=${encodeURIComponent(joinUrl)}`;

  let clerkInvitationId: string | null = null;
  if (parsed.data.email && parsed.data.email.trim().length > 0) {
    try {
      const inv = await sendClerkInvitation({
        emailAddress: parsed.data.email.trim(),
        redirectUrl,
        shopId: ctx.shopId,
        role: parsed.data.role,
      });
      clerkInvitationId = inv.id;
    } catch (err: any) {
      console.warn("Notice: Clerk email delivery issue (invite code remains valid):", err?.message || err);
      // Non-fatal: Employee can still join with the invite code directly!
    }
  }

  const memberUserId = parsed.data.userId || `inv_${rawCode}`;
  const status = parsed.data.userId ? "active" : "pending";

  const [row] = await db
    .insert(shopUsersTable)
    .values({
      shopId: ctx.shopId,
      userId: memberUserId,
      email: parsed.data.email?.trim() || null,
      name: parsed.data.name?.trim() || null,
      role: parsed.data.role,
      status,
      invitedBy: ctx.userId,
    })
    .onConflictDoUpdate({
      target: [shopUsersTable.shopId, shopUsersTable.userId],
      set: {
        role: parsed.data.role,
        name: parsed.data.name?.trim() || null,
        email: parsed.data.email?.trim() || null,
        status,
      },
    })
    .returning();

  res.status(201).json({
    id: row.id,
    userId: row.userId,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    inviteCode: status === "pending" ? rawCode : null,
    joinUrl: status === "pending" ? joinUrl : null,
  });
});

router.delete("/shops/current/members/:id", async (req, res): Promise<void> => {
  const ctx = requireRole(req, "admin");
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid member id" });
    return;
  }

  const [member] = await db
    .select()
    .from(shopUsersTable)
    .where(and(eq(shopUsersTable.id, id), eq(shopUsersTable.shopId, ctx.shopId)));

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  if (member.userId === ctx.userId) {
    throw new RouteError(400, "নিজেকে সরানো যাবে না");
  }

  await db
    .delete(shopUsersTable)
    .where(and(eq(shopUsersTable.id, id), eq(shopUsersTable.shopId, ctx.shopId)));

  res.status(204).end();
});

/**
 * Allows a signed-in user (employee / shopkeeper / manager) to join a shop
 * using an Invite Code (e.g. "INV-849201" or numeric "849201").
 */
router.post("/shops/join", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const rawCode = String(req.body?.inviteCode || req.body?.code || "").trim();
  if (!rawCode) {
    res.status(400).json({ error: "ইনভাইট কোড আবশ্যক" });
    return;
  }

  const cleanNum = rawCode.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
  const strippedCode = cleanNum.replace(/^INV/, "");

  // Check if code matches any pending member in shop_users (by code, email, or user placeholder)
  const candidates = await db
    .select()
    .from(shopUsersTable)
    .where(
      and(
        or(
          sql`UPPER(${shopUsersTable.userId}) LIKE ${`%${strippedCode}%`}`,
          sql`UPPER(${shopUsersTable.userId}) = ${`INV_${rawCode.toUpperCase()}`}`,
          sql`UPPER(${shopUsersTable.userId}) = ${rawCode.toUpperCase()}`,
          sql`LOWER(${shopUsersTable.email}) = ${rawCode.toLowerCase()}`
        ),
        eq(shopUsersTable.status, "pending"),
      ),
    );

  const matched = candidates[0];
  if (!matched) {
    res.status(404).json({
      error: "ইনভাইট কোডটি সঠিক নয় বা ইতিমধ্যে ব্যবহৃত হয়েছে। দোকানের মালিকের সাথে যোগাযোগ করুন।",
    });
    return;
  }

  // Check if user is already a member of this shop to prevent unique constraint conflicts
  const existingMembership = await db
    .select()
    .from(shopUsersTable)
    .where(
      and(
        eq(shopUsersTable.shopId, matched.shopId),
        eq(shopUsersTable.userId, userId),
      ),
    );

  let targetShopId = matched.shopId;
  let targetRole = matched.role;

  if (existingMembership.length > 0) {
    // User is already a member — update role and activate
    await db
      .update(shopUsersTable)
      .set({
        role: matched.role,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(shopUsersTable.id, existingMembership[0].id));

    // Remove the placeholder invite row
    await db.delete(shopUsersTable).where(eq(shopUsersTable.id, matched.id));
    targetShopId = existingMembership[0].shopId;
    targetRole = matched.role;
  } else {
    // Activate the invited user as member
    await db
      .update(shopUsersTable)
      .set({
        userId,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(shopUsersTable.id, matched.id));
  }

  const [shop] = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.id, targetShopId));

  res.json({
    success: true,
    shop: serializeShop(shop),
    role: targetRole,
    message: `সফলভাবে ${shop?.name || "দোকানে"} ${targetRole === "manager" ? "ম্যানেজার" : "দোকানদার"} হিসেবে যুক্ত হয়েছেন!`,
  });
});

/** Convenience: who am I, in this shop? Used to gate UI affordances. */
router.get("/shops/current/me", async (req, res): Promise<void> => {
  const ctx = requireShop(req);
  res.json({
    userId: ctx.userId,
    shopId: ctx.shopId,
    organizationId: ctx.organizationId,
    role: ctx.role,
  });
});

export default router;
