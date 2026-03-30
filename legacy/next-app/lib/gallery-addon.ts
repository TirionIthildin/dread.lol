/**
 * Gallery addon: purchasable product that grants image hosting.
 * Premium also includes gallery; this addon is for users who want just gallery.
 * Each purchase counts; users can buy multiple (e.g. for extra capacity or gifting).
 */
import { getUserPolarState } from "@/lib/polar-subscription";
import { getBillingSettings } from "@/lib/settings";

export async function hasGalleryAddon(userId: string): Promise<boolean> {
  return (await getGalleryAddonCount(userId)) > 0;
}

/** Number of gallery addon purchases the user has. */
export async function getGalleryAddonCount(userId: string): Promise<number> {
  const [billing, polarState] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(userId),
  ]);
  const ids = billing.galleryAddonProductIds ?? [];
  if (ids.length === 0) return 0;
  let count = 0;
  for (const id of ids) {
    count += polarState.ownedProductQuantities[id] ?? 0;
  }
  return count;
}
