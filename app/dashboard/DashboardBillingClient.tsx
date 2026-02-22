"use client";

import Link from "next/link";
import { CreditCard, CheckCircle, Plus } from "@phosphor-icons/react";

type Props = {
  billingEnabled: boolean;
  hasActiveSubscription: boolean;
  activeSubscription: {
    polarSubscriptionId: string;
    productId: string;
    productName?: string;
    status: string;
  } | null;
  ownedProductIds: string[];
};

export default function DashboardBillingClient({
  billingEnabled,
  hasActiveSubscription,
  activeSubscription,
  ownedProductIds,
}: Props) {
  if (!billingEnabled) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-6 text-center">
        <CreditCard size={32} weight="regular" className="mx-auto text-[var(--muted)] mb-3" />
        <p className="text-sm text-[var(--muted)]">
          Billing is not configured. Admins can enable it in Admin → Billing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasActiveSubscription && activeSubscription && (
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} weight="fill" className="text-[var(--accent)] shrink-0" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Active subscription
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">
            {activeSubscription.productName ?? activeSubscription.productId}
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

      {!hasActiveSubscription && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4">
          <p className="text-sm text-[var(--muted)] mb-4">
            You don&apos;t have an active subscription.
          </p>
          <Link
            href="/api/polar/checkout-redirect"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            <Plus size={18} weight="regular" />
            Subscribe
          </Link>
        </div>
      )}

      {ownedProductIds.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 p-4">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
            Owned products
          </p>
          <ul className="text-sm text-[var(--foreground)] space-y-1">
            {ownedProductIds.map((id) => (
              <li key={id}>
                <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-xs">{id}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
