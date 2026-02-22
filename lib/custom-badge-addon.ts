/**
 * Custom badge addon: purchasable product that lets users create their own badge.
 * Each purchase = one badge slot. Users can buy multiple.
 */
import { getUserPolarState } from "@/lib/polar-subscription";
import { getBillingSettings } from "@/lib/settings";

export async function hasCustomBadgeAddon(userId: string): Promise<boolean> {
  return (await getCustomBadgeAddonCount(userId)) > 0;
}

/** Number of custom badge slots the user has (each purchase = 1 slot). */
export async function getCustomBadgeAddonCount(userId: string): Promise<number> {
  const [billing, polarState] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(userId),
  ]);
  const ids = billing.customBadgeProductIds ?? [];
  if (ids.length === 0) return 0;
  let count = 0;
  for (const id of ids) {
    count += polarState.ownedProductQuantities[id] ?? 0;
  }
  return count;
}
