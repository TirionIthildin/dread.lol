/**
 * Premium permission checks. Use hasPremiumAccess() anywhere you need to gate
 * Premium-only features.
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { getUserPolarState } from "@/lib/polar-subscription";
import { getBillingSettings } from "@/lib/settings";
import type { UserDoc } from "@/lib/db/schema";

export type PremiumSource = "subscription" | "product" | "granted" | "verified_creator" | null;

export interface PremiumAccess {
  hasAccess: boolean;
  source: PremiumSource;
}

/**
 * Check if a user has Premium access from any source:
 * - Admin-granted free Premium (premiumGranted on user doc)
 * - Verified Creator program (verifiedCreator on user doc)
 * - Active Polar subscription for the Premium product
 * - Owned Premium product (one-time purchase)
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const result = await getPremiumAccess(userId);
  return result.hasAccess;
}

/**
 * Get Premium access with source for UI (e.g. "Premium (admin granted)").
 */
export async function getPremiumAccess(userId: string): Promise<PremiumAccess> {
  const [billing, polarState, userDoc] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(userId),
    getUserDocForPremium(userId),
  ]);

  if (userDoc?.premiumGranted) {
    return { hasAccess: true, source: "granted" };
  }

  if (userDoc?.verifiedCreator) {
    return { hasAccess: true, source: "verified_creator" };
  }

  const productIds = billing.productIds;
  if (productIds.length === 0) return { hasAccess: false, source: null };

  if (polarState.hasActiveSubscription && polarState.activeSubscription && productIds.includes(polarState.activeSubscription.productId)) {
    return { hasAccess: true, source: "subscription" };
  }
  if (polarState.ownedProductIds.some((id) => productIds.includes(id))) {
    return { hasAccess: true, source: "product" };
  }
  return { hasAccess: false, source: null };
}

async function getUserDocForPremium(userId: string): Promise<Pick<UserDoc, "premiumGranted" | "verifiedCreator"> | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne({ _id: userId }, { projection: { premiumGranted: 1, verifiedCreator: 1 } });
  return doc;
}
