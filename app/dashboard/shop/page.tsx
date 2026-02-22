import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { getBillingSettings } from "@/lib/settings";
import { getUserPolarState } from "@/lib/polar-subscription";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getProductsWithTypes, formatPrice, type PolarProductPrice } from "@/lib/polar-products";
import { hasCustomBadgeAddon, getCustomBadgeAddonCount } from "@/lib/custom-badge-addon";
import { hasGalleryAddon } from "@/lib/gallery-addon";
import DashboardShopClient from "@/app/dashboard/DashboardShopClient";

export const metadata: Metadata = {
  title: "Shop",
  description: `Premium and addons for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

export default async function ShopPage() {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const canUseDashboard = user && (user.approved || user.isAdmin);

  if (!session || !canUseDashboard) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-6 text-center">
        <p className="text-[var(--muted)] text-sm">
          Sign in and get approved to view the shop.
        </p>
      </div>
    );
  }

  const [billing, polarState, premiumAccess, customBadgeAddon, customBadgeSlotCount, galleryAddon] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(session.sub),
    getPremiumAccess(session.sub),
    hasCustomBadgeAddon(session.sub),
    getCustomBadgeAddonCount(session.sub),
    hasGalleryAddon(session.sub),
  ]);

  const allProductIds = [
    ...billing.productIds,
    ...(billing.customBadgeProductIds ?? []),
    ...(billing.galleryAddonProductIds ?? []),
  ];
  const productMap =
    allProductIds.length > 0
      ? await getProductsWithTypes(allProductIds, { sandbox: billing.sandbox })
      : new Map();

  const premiumProducts = billing.productIds.map((id) => {
    const info = productMap.get(id);
    return {
      id,
      name: info?.name ?? id,
      isRecurring: info?.isRecurring ?? false,
      priceFormatted: info?.price ? formatPrice(info.price) : null,
      pricesFormatted: info?.prices?.map((p: PolarProductPrice) => formatPrice(p)).filter(Boolean) ?? [],
    };
  });

  const customBadgeProducts = (billing.customBadgeProductIds ?? []).map((id) => {
    const info = productMap.get(id);
    return {
      id,
      name: info?.name ?? id,
      isRecurring: info?.isRecurring ?? false,
      priceFormatted: info?.price ? formatPrice(info.price) : null,
      pricesFormatted: info?.prices?.map((p: PolarProductPrice) => formatPrice(p)).filter(Boolean) ?? [],
    };
  });

  const galleryAddonProducts = (billing.galleryAddonProductIds ?? []).map((id) => {
    const info = productMap.get(id);
    return {
      id,
      name: info?.name ?? id,
      isRecurring: info?.isRecurring ?? false,
      priceFormatted: info?.price ? formatPrice(info.price) : null,
      pricesFormatted: info?.prices?.map((p: PolarProductPrice) => formatPrice(p)).filter(Boolean) ?? [],
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Shop</h1>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          Premium unlocks effects, analytics, and more. Add custom badges and other addons.
        </p>
      </div>

      <DashboardShopClient
        billingEnabled={billing.enabled}
        tierName={billing.tierName}
        premiumProducts={premiumProducts}
        hasActiveSubscription={polarState.hasActiveSubscription}
        activeSubscription={polarState.activeSubscription ?? null}
        ownedProductIds={polarState.ownedProductIds}
        hasPremiumAccess={premiumAccess.hasAccess}
        premiumSource={premiumAccess.source}
        customBadgeProducts={customBadgeProducts}
        hasCustomBadgeAddon={customBadgeAddon}
        customBadgeSlotCount={customBadgeSlotCount}
        galleryAddonProducts={galleryAddonProducts}
        hasGalleryAddon={galleryAddon}
      />
    </div>
  );
}
