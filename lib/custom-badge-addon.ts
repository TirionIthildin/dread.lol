/**
 * Custom badge addon: purchasable product that lets users create their own badge.
 */
import { getUserPolarState } from "@/lib/polar-subscription";
import { getBillingSettings } from "@/lib/settings";

export async function hasCustomBadgeAddon(userId: string): Promise<boolean> {
  const [billing, polarState] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(userId),
  ]);
  const ids = billing.customBadgeProductIds ?? [];
  if (ids.length === 0) return false;
  return polarState.ownedProductIds.some((id) => ids.includes(id));
}
