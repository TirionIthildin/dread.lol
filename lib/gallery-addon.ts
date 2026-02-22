/**
 * Gallery addon: purchasable product that grants image hosting.
 * Premium also includes gallery; this addon is for users who want just gallery.
 */
import { getUserPolarState } from "@/lib/polar-subscription";
import { getBillingSettings } from "@/lib/settings";

export async function hasGalleryAddon(userId: string): Promise<boolean> {
  const [billing, polarState] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(userId),
  ]);
  const ids = billing.galleryAddonProductIds ?? [];
  if (ids.length === 0) return false;
  return polarState.ownedProductIds.some((id) => ids.includes(id));
}
