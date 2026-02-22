import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { getBillingSettings } from "@/lib/settings";
import { getUserPolarState } from "@/lib/polar-subscription";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getProductsWithTypes, formatPrice, type PolarProductPrice } from "@/lib/polar-products";
import DashboardBillingClient from "@/app/dashboard/DashboardBillingClient";

export const metadata: Metadata = {
  title: "Premium",
  description: `Manage your Premium subscription for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

export default async function BillingPage() {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const canUseDashboard = user && (user.approved || user.isAdmin);

  if (!session || !canUseDashboard) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-6 text-center">
        <p className="text-[var(--muted)] text-sm">
          Sign in and get approved to view billing.
        </p>
      </div>
    );
  }

  const [billing, polarState, premiumAccess] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(session.sub),
    getPremiumAccess(session.sub),
  ]);

  const hasBasicPurchase =
    billing.basicEnabled &&
    billing.basicProductIds.length > 0 &&
    polarState.ownedProductIds.some((id) => billing.basicProductIds.includes(id));

  let basicPriceFormatted: string | null = null;
  if (billing.basicEnabled && billing.basicProductIds.length > 0) {
    const basicMap = await getProductsWithTypes(billing.basicProductIds, {
      sandbox: billing.sandbox,
    });
    const firstBasic = billing.basicProductIds[0];
    const info = firstBasic ? basicMap.get(firstBasic) : null;
    basicPriceFormatted = info?.price ? formatPrice(info.price) : null;
    if (basicPriceFormatted === "Pay what you want" || !basicPriceFormatted) {
      basicPriceFormatted = `$${(billing.basicPriceCents / 100).toFixed(0)}`;
    }
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Premium</h1>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          Manage your subscription, unlock effects, analytics, and more.
        </p>
      </div>

      <DashboardBillingClient
        billingEnabled={billing.enabled}
        tierName={billing.tierName}
        premiumProducts={premiumProducts}
        hasActiveSubscription={polarState.hasActiveSubscription}
        activeSubscription={polarState.activeSubscription ?? null}
        ownedProductIds={polarState.ownedProductIds}
        hasPremiumAccess={premiumAccess.hasAccess}
        premiumSource={premiumAccess.source}
        basicEnabled={billing.basicEnabled}
        hasBasicPurchase={hasBasicPurchase}
        basicTierName={billing.basicTierName}
        basicPriceFormatted={basicPriceFormatted}
      />
    </div>
  );
}
