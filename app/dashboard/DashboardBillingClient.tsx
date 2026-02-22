"use client";

import Link from "next/link";
import {
  CreditCard,
  CheckCircle,
  Plus,
  Crown,
  Sparkle,
  Lock,
  ChartLine,
  Palette,
  ImageSquare,
  CrownSimple,
} from "@phosphor-icons/react";
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

const PREMIUM_FEATURES = [
  { icon: Sparkle, label: "Username effects", desc: "Typewriter, sparkle effects" },
  { icon: Palette, label: "Custom colors", desc: "Accent, text, background" },
  { icon: ImageSquare, label: "Background effects", desc: "Snow, rain, blur, retro" },
  { icon: ChartLine, label: "Profile analytics", desc: "Views, traffic sources" },
  { icon: CrownSimple, label: "Premium badge", desc: "Stand out on your profile" },
];

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
  const subProducts = premiumProducts.filter((p) => p.isRecurring);
  const oneTimeProducts = premiumProducts.filter((p) => !p.isRecurring);
  const ownedPremium = ownedProductIds.some((id) => premiumProductIds.includes(id));

  if (!billingEnabled) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--border)]/50">
          <CreditCard size={32} weight="duotone" className="text-[var(--muted)]" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
          Premium not configured
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
          Admins can enable billing and add products in Admin → Billing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero status */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 ${
          hasPremiumAccess
            ? "border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent"
            : "border-[var(--border)] bg-[var(--surface)]"
        }`}
      >
        {hasPremiumAccess && (
          <div className="pointer-events-none absolute -right-8 -top-8 text-[8rem] opacity-[0.07]">
            <Crown weight="fill" className="text-[var(--accent)]" />
          </div>
        )}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  hasPremiumAccess ? "bg-[var(--accent)]/20" : "bg-[var(--border)]/50"
                }`}
              >
                {hasPremiumAccess ? (
                  <Crown size={24} weight="fill" className="text-[var(--accent)]" />
                ) : (
                  <Crown size={24} weight="regular" className="text-[var(--muted)]" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  {hasPremiumAccess ? `You have ${tierName}` : `Upgrade to ${tierName}`}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  {premiumSource === "granted" && "Complimentary access from an admin"}
                  {premiumSource === "subscription" && "Active subscription"}
                  {premiumSource === "product" && "One-time purchase"}
                  {!hasPremiumAccess && "Unlock effects, analytics, and more"}
                </p>
              </div>
            </div>
          </div>
          {hasPremiumAccess && hasActiveSubscription && (
            <Link
              href="/api/polar/customer-portal"
              prefetch={false}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-5 py-2.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
            >
              <CreditCard size={18} weight="regular" />
              Manage subscription
            </Link>
          )}
        </div>
      </div>

      {/* Upgrade section – when no access or has one-time but no sub */}
      {(!hasPremiumAccess || (ownedPremium && !hasActiveSubscription && hasSubscriptionProducts)) && (
        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            {hasPremiumAccess ? "Add recurring access" : "Choose your plan"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {subProducts.map((prod) => (
              <PlanCard
                key={prod.id}
                name={tierName}
                priceStr={prod.priceFormatted ?? prod.pricesFormatted[0] ?? null}
                description="Recurring access, cancel anytime"
                cta="Subscribe"
                href="/api/polar/checkout-redirect?prefer=recurring"
                icon={<Plus size={20} weight="regular" />}
                featured
              />
            ))}
            {oneTimeProducts.map((prod) => (
              <PlanCard
                key={prod.id}
                name={prod.name}
                priceStr={prod.priceFormatted ?? prod.pricesFormatted[0] ?? null}
                description="Pay once, keep forever"
                cta="Buy"
                href="/api/polar/checkout-redirect?prefer=one_time"
                icon={<CreditCard size={20} weight="regular" />}
              />
            ))}
            {!hasSubscriptionProducts && !hasOneTimeProducts && (
              <PlanCard
                name={tierName}
                priceStr={null}
                description="Get started"
                cta="Get Premium"
                href="/api/polar/checkout-redirect"
                icon={<Plus size={20} weight="regular" />}
                featured
              />
            )}
          </div>
        </section>
      )}

      {/* Owned products */}
      {ownedProductIds.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Your products
          </h3>
          <div className="flex flex-wrap gap-2">
            {ownedProductIds.map((id) => {
              const prod = premiumProducts.find((p) => p.id === id);
              const label = prod ? (prod.isRecurring ? tierName : prod.name) : id;
              const priceStr = prod?.priceFormatted ?? prod?.pricesFormatted[0];
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                >
                  <CheckCircle size={18} weight="fill" className="text-[var(--accent)] shrink-0" />
                  <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
                  {priceStr && (
                    <span className="text-xs text-[var(--muted)]">({priceStr})</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Lock size={18} weight="regular" className="text-[var(--muted)]" />
          What {tierName} unlocks
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {PREMIUM_FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                hasPremiumAccess
                  ? "border-[var(--accent)]/20 bg-[var(--accent)]/5"
                  : "border-[var(--border)] bg-[var(--bg)]/30"
              }`}
            >
              <Icon
                size={20}
                weight="regular"
                className={`mt-0.5 shrink-0 ${hasPremiumAccess ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
              />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
                <p className="text-xs text-[var(--muted)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlanCard({
  name,
  priceStr,
  description,
  cta,
  href,
  icon,
  featured = false,
}: {
  name: string;
  priceStr: string | null;
  description: string;
  cta: string;
  href: string;
  icon: React.ReactNode;
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border p-6 transition-colors ${
        featured
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/5 hover:border-[var(--accent)]/60"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)]"
      }`}
    >
      <div>
        <h4 className="text-lg font-semibold text-[var(--foreground)]">{name}</h4>
        {priceStr && (
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{priceStr}</p>
        )}
        <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
      </div>
      <Link
        href={href}
        prefetch={false}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
          featured
            ? "border-2 border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30"
            : "border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--foreground)] hover:border-[var(--border-bright)]"
        }`}
      >
        {icon}
        {cta}
      </Link>
    </div>
  );
}
