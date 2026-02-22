"use client";

import Link from "next/link";
import { CreditCard, CheckCircle, Plus } from "@phosphor-icons/react";
import type { PremiumSource } from "@/lib/premium-permissions";

type PremiumProduct = {
  id: string;
  name: string;
  isRecurring: boolean;
  priceFormatted: string | null;
  pricesFormatted: string[];
};

type Props = {
  billingEnabled: boolean;
  tierName: string;
  premiumProducts: PremiumProduct[];
  hasActiveSubscription: boolean;
  activeSubscription: {
    polarSubscriptionId: string;
    productId: string;
    productName?: string;
    status: string;
  } | null;
  ownedProductIds: string[];
  hasPremiumAccess: boolean;
  premiumSource: PremiumSource;
};

export default function DashboardBillingClient({
  billingEnabled,
  tierName,
  premiumProducts,
  hasActiveSubscription,
  activeSubscription,
  ownedProductIds,
  hasPremiumAccess,
  premiumSource,
}: Props) {
  const premiumProductIds = premiumProducts.map((p) => p.id);
  const hasSubscriptionProducts = premiumProducts.some((p) => p.isRecurring);
  const hasOneTimeProducts = premiumProducts.some((p) => !p.isRecurring);
  if (!billingEnabled) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-6 text-center">
        <CreditCard size={32} weight="regular" className="mx-auto text-[var(--muted)] mb-3" />
        <p className="text-sm text-[var(--muted)]">
          Premium is not configured. Admins can enable it in Admin → Billing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {premiumSource === "granted" && (
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} weight="fill" className="text-[var(--accent)] shrink-0" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              {tierName} (complimentary)
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            You have free Premium access granted by an admin.
          </p>
        </div>
      )}

      {hasActiveSubscription && activeSubscription && (
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} weight="fill" className="text-[var(--accent)] shrink-0" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Active subscription
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">
            {(() => {
              const p = premiumProducts.find((x) => x.id === activeSubscription.productId);
              return p ? (p.isRecurring ? tierName : p.name) : (activeSubscription.productName ?? activeSubscription.productId);
            })()}
          </p>
          <Link
            href="/api/polar/customer-portal"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            <CreditCard size={18} weight="regular" />
            Manage subscription
          </Link>
        </div>
      )}

      {!hasActiveSubscription && premiumSource !== "granted" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
          {ownedProductIds.length > 0 &&
          premiumProductIds.length > 0 &&
          ownedProductIds.some((id) => premiumProductIds.includes(id)) ? (
            <>
              <p className="text-sm text-[var(--muted)] mb-4">
                You have {tierName} (one-time purchase).{hasSubscriptionProducts && " Subscribe for recurring access."}
              </p>
              {hasSubscriptionProducts && (() => {
                const subProd = premiumProducts.find((p) => p.isRecurring);
                const priceStr = subProd?.priceFormatted ?? subProd?.pricesFormatted[0];
                return (
                  <Link
                    href="/api/polar/checkout-redirect?prefer=recurring"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                  >
                    <Plus size={18} weight="regular" />
                    Subscribe{priceStr ? ` – ${priceStr}` : ""}
                  </Link>
                );
              })()}
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--muted)] mb-4">
                You don&apos;t have {tierName} yet.
              </p>
              <div className="flex flex-wrap gap-2">
                {hasSubscriptionProducts && (() => {
                  const subProd = premiumProducts.find((p) => p.isRecurring);
                  const priceStr = subProd?.priceFormatted ?? subProd?.pricesFormatted[0];
                  return (
                    <Link
                      href="/api/polar/checkout-redirect?prefer=recurring"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                    >
                      <Plus size={18} weight="regular" />
                      Subscribe to {tierName}{priceStr ? ` – ${priceStr}` : ""}
                    </Link>
                  );
                })()}
                {hasOneTimeProducts && (() => {
                  const oneProd = premiumProducts.find((p) => !p.isRecurring);
                  const priceStr = oneProd?.priceFormatted ?? oneProd?.pricesFormatted[0];
                  return (
                    <Link
                      href="/api/polar/checkout-redirect?prefer=one_time"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <CreditCard size={18} weight="regular" />
                      Buy {tierName}{priceStr ? ` – ${priceStr}` : ""}
                    </Link>
                  );
                })()}
                {!hasSubscriptionProducts && !hasOneTimeProducts && (
                  <Link
                    href="/api/polar/checkout-redirect"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                  >
                    <Plus size={18} weight="regular" />
                    Get {tierName}
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {ownedProductIds.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 p-4">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
            Owned
          </p>
          <ul className="text-sm text-[var(--foreground)] space-y-1">
            {ownedProductIds.map((id) => {
              const prod = premiumProducts.find((p) => p.id === id);
              const label = prod ? (prod.isRecurring ? tierName : prod.name) : id;
              const priceStr = prod?.priceFormatted ?? prod?.pricesFormatted[0];
              return (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-xs">
                    {label}
                  </span>
                  {priceStr && (
                    <span className="text-xs text-[var(--muted)]">{priceStr}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
