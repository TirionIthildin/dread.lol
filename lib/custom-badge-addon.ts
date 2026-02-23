/**
 * Custom badge addon: purchasable product that lets users create their own badge.
 * Each purchase = one badge slot. Users can buy multiple.
 * Admins can also grant voucher slots (customBadgeVouchers on user doc).
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { getUserPolarState } from "@/lib/polar-subscription";
import { getBillingSettings } from "@/lib/settings";

export async function hasCustomBadgeAddon(userId: string): Promise<boolean> {
  return (await getCustomBadgeAddonCount(userId)) > 0;
}

/** Number of custom badge slots the user has (purchases + admin vouchers). */
export async function getCustomBadgeAddonCount(userId: string): Promise<number> {
  const [billing, polarState, userDoc] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(userId),
    (async () => {
      const client = await getDb();
      const dbName = await getDbName();
      const doc = await client.db(dbName).collection(COLLECTIONS.users).findOne(
        { _id: userId },
        { projection: { customBadgeVouchers: 1 } }
      );
      return doc as { customBadgeVouchers?: number } | null;
    })(),
  ]);
  let count = 0;
  const ids = billing.customBadgeProductIds ?? [];
  for (const id of ids) {
    count += polarState.ownedProductQuantities[id] ?? 0;
  }
  count += Math.max(0, userDoc?.customBadgeVouchers ?? 0);
  return count;
}
