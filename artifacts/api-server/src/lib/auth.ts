import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/**
 * Returns the authenticated shopkeeper's Clerk user ID.
 *
 * Every route that reads or writes shop data (products, customers, sales,
 * ledger entries) MUST call this and filter/insert on the result — it is
 * the tenant boundary between shopkeepers. Only safe to call on routes
 * mounted after `requireAuth`, which guarantees `userId` is present; throws
 * otherwise so a missing-auth bug fails loudly instead of silently leaking
 * cross-tenant data.
 */
export function getUserId(req: Request): string {
  const userId = getAuth(req)?.userId;
  if (!userId) {
    // Should be unreachable behind requireAuth — fail loudly rather than
    // risk an unscoped (cross-tenant) query if that invariant is ever broken.
    throw new Error("getUserId called without an authenticated request");
  }
  return userId;
}
