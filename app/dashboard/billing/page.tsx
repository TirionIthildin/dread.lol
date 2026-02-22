import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { getBillingSettings } from "@/lib/settings";
import { getUserPolarState } from "@/lib/polar-subscription";
import { getPremiumAccess } from "@/lib/premium-permissions";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Premium</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage your subscription and payment methods.
        </p>
      </div>

      <DashboardBillingClient
        billingEnabled={billing.enabled}
        tierName={billing.tierName}
        premiumProductId={billing.productId}
        hasActiveSubscription={polarState.hasActiveSubscription}
        activeSubscription={polarState.activeSubscription ?? null}
        ownedProductIds={polarState.ownedProductIds}
        hasPremiumAccess={premiumAccess.hasAccess}
        premiumSource={premiumAccess.source}
      />
    </div>
  );
}
