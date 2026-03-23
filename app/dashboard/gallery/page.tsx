import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile, getGalleryForProfile } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { getBillingSettings } from "@/lib/settings";
import { getProductsWithTypes, formatPrice } from "@/lib/polar-products";
import { hasGalleryAddon } from "@/lib/gallery-addon";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { slugFromUsername } from "@/lib/slug";
import DashboardGalleryPage from "@/app/dashboard/DashboardGalleryPage";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Manage your profile gallery",
  robots: "noindex, nofollow",
};

export default async function GalleryPage() {
  const session = await getSession();
  if (!session) redirect("/dashboard");

  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) redirect("/dashboard");

  const slug = slugFromUsername(session.preferred_username ?? session.name ?? session.sub);
  const name = session.name ?? session.preferred_username ?? "Member";
  const profile = await getOrCreateMemberProfile(user.id, {
    name,
    slug,
    avatarUrl: session.picture ?? undefined,
  });
  const gallery = await getGalleryForProfile(profile.id);

  const [premiumAccess, galleryAddon, billing] = await Promise.all([
    getPremiumAccess(session.sub),
    hasGalleryAddon(session.sub),
    getBillingSettings(),
  ]);
  const hasGalleryAccess = premiumAccess.hasAccess || galleryAddon;

  let galleryAddonProducts: { id: string; name: string; priceFormatted: string | null }[] = [];
  if (!hasGalleryAccess && billing.galleryAddonProductIds?.length && billing.enabled) {
    const productMap = await getProductsWithTypes(billing.galleryAddonProductIds, {
      sandbox: billing.sandbox,
    });
    galleryAddonProducts = billing.galleryAddonProductIds.map((id) => {
      const info = productMap.get(id);
      return {
        id,
        name: info?.name ?? id,
        priceFormatted: info?.price ? formatPrice(info.price) : null,
      };
    });
  }

  return (
    <DashboardGalleryPage
      hasGalleryAccess={hasGalleryAccess}
      billingEnabled={billing.enabled}
      galleryAddonProducts={galleryAddonProducts}
      profileId={profile.id}
      profileSlug={profile.slug}
      initialGallery={gallery}
    />
  );
}
