import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { getBillingSettings } from "@/lib/settings";
import { getProductsWithTypes, formatPrice } from "@/lib/polar-products";
import { hasCustomBadgeAddon, getCustomBadgeAddonCount } from "@/lib/custom-badge-addon";
import DashboardBadgesClient from "@/app/[locale]/dashboard/DashboardBadgesClient";

export const metadata: Metadata = {
  title: "Badges",
  description: "Create custom badges for your profile",
  robots: "noindex, nofollow",
};

export default async function BadgesPage() {
  const session = await getSession();
  if (!session) redirect("/dashboard");

  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) redirect("/dashboard");

  const [billing, hasAddon, slotCount] = await Promise.all([
    getBillingSettings(),
    hasCustomBadgeAddon(session.sub),
    getCustomBadgeAddonCount(session.sub),
  ]);

  let customBadgeProducts: { id: string; name: string; priceFormatted: string | null }[] = [];
  if (billing.customBadgeProductIds?.length && billing.enabled) {
    const productMap = await getProductsWithTypes(billing.customBadgeProductIds, {
      sandbox: billing.sandbox,
    });
    customBadgeProducts = billing.customBadgeProductIds.map((id) => {
      const info = productMap.get(id);
      return {
        id,
        name: info?.name ?? id,
        priceFormatted: info?.price ? formatPrice(info.price) : null,
      };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Custom badges</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Create badges with label, color, icon, or image. They appear on your profile.
        </p>
      </div>
      <DashboardBadgesClient
        hasAddon={hasAddon}
        slotCount={slotCount}
        customBadgeProducts={customBadgeProducts}
        billingEnabled={billing.enabled}
      />
    </div>
  );
}
