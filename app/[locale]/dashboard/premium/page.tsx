import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { getBillingSettings } from "@/lib/settings";
import { getUserPolarState } from "@/lib/polar-subscription";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getProductsWithTypes, formatPrice, type PolarProductPrice } from "@/lib/polar-products";
import { canUseDashboard } from "@/lib/dashboard-access";
import DashboardPremiumClient from "@/app/[locale]/dashboard/DashboardPremiumClient";

export const metadata: Metadata = {
  title: "Premium",
  description: `Unlock Premium for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

export default async function PremiumPage() {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;

  if (!session || !canUseDashboard(user)) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-6 text-center">
        <p className="text-[var(--muted)] text-sm">
          Sign in to view Premium.
        </p>
      </div>
    );
  }

  const [billing, polarState, premiumAccess] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(session.sub),
    getPremiumAccess(session.sub),
  ]);

  const productMap =
    billing.productIds.length > 0
      ? await getProductsWithTypes(billing.productIds, { sandbox: billing.sandbox })
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

  const premiumOwnedProductIds = polarState.ownedProductIds.filter((id) =>
    billing.productIds.includes(id)
  );
  const ownedProductQuantities = Object.fromEntries(
    Object.entries(polarState.ownedProductQuantities).filter(([id]) =>
      billing.productIds.includes(id)
    )
  );

  return (
    <div className="space-y-8">
      <DashboardPremiumClient
        billingEnabled={billing.enabled}
        tierName={billing.tierName}
        premiumProducts={premiumProducts}
        hasActiveSubscription={polarState.hasActiveSubscription}
        activeSubscription={polarState.activeSubscription ?? null}
        ownedProductIds={premiumOwnedProductIds}
        ownedProductQuantities={ownedProductQuantities}
        hasPremiumAccess={premiumAccess.hasAccess}
        premiumSource={premiumAccess.source}
      />
    </div>
  );
}
