import { createClerkClient } from "@clerk/express";

/**
 * Creates a Clerk backend client instance initialized with CLERK_SECRET_KEY.
 */
export function getClerkClient() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY server variable is not configured");
  }
  return createClerkClient({ secretKey });
}

/**
 * Triggers an official Clerk invitation email to the recipient.
 */
export async function sendClerkInvitation(params: {
  emailAddress: string;
  redirectUrl?: string;
  shopId: number;
  role: string;
}) {
  const clerk = getClerkClient();
  const invitation = await clerk.invitations.createInvitation({
    emailAddress: params.emailAddress,
    redirectUrl: params.redirectUrl,
    publicMetadata: {
      shopId: params.shopId,
      role: params.role,
    },
    ignoreExisting: true,
  });
  return invitation;
}

/**
 * Retrieves the primary email address of a signed-in Clerk user.
 */
export async function getClerkUserPrimaryEmail(userId: string): Promise<string | null> {
  const ids = await getClerkUserIdentifiers(userId);
  return ids.email;
}

/**
 * Retrieves the primary email address and phone number of a signed-in Clerk user.
 */
export async function getClerkUserIdentifiers(userId: string): Promise<{ email: string | null; phone: string | null }> {
  try {
    const clerk = getClerkClient();
    const user = await clerk.users.getUser(userId);
    const primaryEmailId = user.primaryEmailAddressId;
    const emailObj =
      user.emailAddresses.find((e) => e.id === primaryEmailId) ||
      user.emailAddresses[0];
    const primaryPhoneId = user.primaryPhoneNumberId;
    const phoneObj =
      user.phoneNumbers.find((p) => p.id === primaryPhoneId) ||
      user.phoneNumbers[0];
    return {
      email: emailObj?.emailAddress ?? null,
      phone: phoneObj?.phoneNumber ?? null,
    };
  } catch (err: any) {
    console.warn(`Unable to fetch Clerk user identifiers for ${userId}:`, err?.message || err);
    return { email: null, phone: null };
  }
}

