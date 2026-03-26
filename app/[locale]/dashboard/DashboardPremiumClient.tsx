"use client";

import Link from "next/link";
import {
  CreditCard,
  CheckCircle,
  Plus,
  Crown,
  Sparkle,
  Lock,
  LineChart,
  Palette,
  Frame,
  Newspaper,
  Copy,
  Layers,
  Medal,
  Images,
} from "lucide-react";
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
  ownedProductQuantities: Record<string, number>;
  hasPremiumAccess: boolean;
  premiumSource: PremiumSource;
};

const PREMIUM_FEATURES = [
  { icon: Sparkle, label: "Username effects", desc: "Typewriter, sparkle, animated text" },
  { icon: Palette, label: "Custom colors", desc: "Accent, text, background" },
  { icon: Frame, label: "Background effects", desc: "Snow, rain, blur, retro" },
  { icon: LineChart, label: "Profile analytics", desc: "Views, traffic sources, devices" },
  { icon: Crown, label: "Premium badge", desc: "Stand out on your profile" },
  { icon: Newspaper, label: "Profile microblog", desc: "Write posts on your profile" },
  { icon: Layers, label: "Unlimited gallery", desc: "No limit on profile images" },
  { icon: Copy, label: "Unlimited pastes", desc: "Create pastes without monthly caps" },
];

export default function DashboardPremiumClient({
  billingEnabled,
  tierName,
  premiumProducts,
  hasActiveSubscription,
  ownedProductIds,
  ownedProductQuantities,
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
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface)]/50 p-12 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/20">
          <CreditCard size={40} strokeWidth={1.5} className="text-[var(--accent)]" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[var(--foreground)]">
          Premium not yet available
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          Premium is not configured yet. Admins can enable it in Admin → Premium.
        </p>
      </div>
    );
  }

  const statusLabel =
    premiumSource === "granted"
      ? "Complimentary access from admin"
      : premiumSource === "verified_creator"
        ? "Verified Creator program"
        : premiumSource === "subscription"
          ? "Active subscription"
          : premiumSource === "product"
            ? "Lifetime access"
            : null;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">Premium</h1>

      {/* Premium hero */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 transition-colors ${
          hasPremiumAccess
            ? "border-[var(--accent)]/50 bg-gradient-to-br from-[var(--accent)]/15 via-[var(--accent)]/8 to-transparent shadow-[0_0_40px_-12px_var(--accent)]"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)]"
        }`}
      >
        {hasPremiumAccess && (
          <>
            <div className="pointer-events-none absolute -right-4 -top-4 text-[10rem] opacity-[0.06]">
              <Crown className="fill-current text-[var(--accent)]" />
            </div>
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[var(--accent)]/10 blur-2xl" />
          </>
        )}
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                hasPremiumAccess ? "bg-[var(--accent)]/25 shadow-inner" : "bg-[var(--border)]/40"
              }`}
            >
              {hasPremiumAccess ? (
                <Crown size={28} className="fill-current text-[var(--accent)]" />
              ) : (
                <Crown size={28} className="text-[var(--muted)]" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-[var(--foreground)] md:text-2xl">
                  {hasPremiumAccess ? `You have ${tierName}` : `${tierName}`}
                </h2>
                {statusLabel && (
                  <span className="inline-flex items-center rounded-full bg-[var(--accent)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                    {statusLabel}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-[var(--muted)]">
                {hasPremiumAccess
                  ? "All premium features are unlocked on your profile."
                  : "Unlock effects, analytics, custom colors, and more."}
              </p>
            </div>
          </div>
          {hasPremiumAccess && hasActiveSubscription ? (
            <Link
              href="/api/polar/customer-portal"
              prefetch={false}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/15 px-5 py-3 text-sm font-medium text-[var(--accent)] transition-all hover:bg-[var(--accent)]/25 hover:border-[var(--accent)]/70"
            >
              <CreditCard size={18} />
              Manage subscription
            </Link>
          ) : !hasPremiumAccess ? (
            <Link
              href="/api/polar/checkout-redirect"
              prefetch={false}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition-all hover:opacity-90"
            >
              <Plus size={18} />
              Get {tierName}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Your products */}
      {ownedProductIds.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Your subscription
          </h3>
          <div className="flex flex-wrap gap-3">
            {ownedProductIds.map((id) => {
              const prod = premiumProducts.find((p) => p.id === id);
              const label = prod ? (prod.isRecurring ? tierName : prod.name) : id;
              const priceStr = prod?.priceFormatted ?? prod?.pricesFormatted[0];
              const qty = ownedProductQuantities[id] ?? 1;
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--accent)]/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15">
                    <CheckCircle size={18} className="fill-current text-[var(--accent)]" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
                    {qty > 1 && (
                      <span className="ml-2 text-xs text-[var(--muted)]">×{qty}</span>
                    )}
                    {priceStr && (
                      <span className="ml-2 text-xs text-[var(--muted)]">({priceStr})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Premium plans */}
      {(!hasPremiumAccess || (ownedPremium && !hasActiveSubscription && hasSubscriptionProducts)) && (
        <section>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {subProducts.map((prod) => (
              <PlanCard
                key={prod.id}
                name={tierName}
                priceStr={prod.priceFormatted ?? prod.pricesFormatted[0] ?? null}
                period={null}
                description="Full access to all features. Cancel anytime."
                cta="Subscribe"
                href="/api/polar/checkout-redirect?prefer=recurring"
                icon={<Plus size={20} />}
                featured
              />
            ))}
            {oneTimeProducts.map((prod) => (
              <PlanCard
                key={prod.id}
                name={prod.name}
                priceStr={prod.priceFormatted ?? prod.pricesFormatted[0] ?? null}
                period="one-time"
                description="Pay once, keep forever."
                cta="Buy lifetime"
                href="/api/polar/checkout-redirect?prefer=one_time"
                icon={<CreditCard size={20} />}
              />
            ))}
            {!hasSubscriptionProducts && !hasOneTimeProducts && (
              <PlanCard
                name={tierName}
                priceStr={null}
                period={null}
                description="Get started"
                cta="Get Premium"
                href="/api/polar/checkout-redirect"
                icon={<Plus size={20} />}
                featured
              />
            )}
          </div>
        </section>
      )}

      {/* Add-ons – links to dedicated pages */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-6 md:p-8">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Add-ons
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Extend your profile with custom badges and gallery. Each is managed on its own page.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/badges"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-colors"
          >
            <Medal size={18} />
            Custom badges
          </Link>
          <Link
            href="/dashboard/gallery"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-colors"
          >
            <Images size={18} />
            Gallery
          </Link>
        </div>
      </section>

      {/* What's included */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-6 md:p-8">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          <Lock size={18} />
          What {tierName} includes
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PREMIUM_FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                hasPremiumAccess
                  ? "border-[var(--accent)]/25 bg-[var(--accent)]/8"
                  : "border-[var(--border)] bg-[var(--bg)]/40 hover:border-[var(--border-bright)]"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  hasPremiumAccess ? "bg-[var(--accent)]/20" : "bg-[var(--border)]/50"
                }`}
              >
                <Icon
                  size={18}
                  className={hasPremiumAccess ? "text-[var(--accent)]" : "text-[var(--muted)]"}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
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
  period,
  description,
  cta,
  href,
  icon,
  featured = false,
}: {
  name: string;
  priceStr: string | null;
  period: string | null;
  description: string;
  cta: string;
  href: string;
  icon: React.ReactNode;
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border p-6 transition-all ${
        featured
          ? "border-[var(--accent)]/50 bg-[var(--accent)]/8 shadow-[0_0_24px_-8px_var(--accent)] hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/12"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-bright)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      <div>
        <h4 className="text-lg font-semibold text-[var(--foreground)]">{name}</h4>
        {priceStr && (
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{priceStr}</span>
            {period && (
              <span className="text-sm font-normal text-[var(--muted)]">{period}</span>
            )}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
      </div>
      <Link
        href={href}
        prefetch={false}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
          featured
            ? "bg-[var(--accent)]/25 text-[var(--accent)] ring-1 ring-[var(--accent)]/40 hover:bg-[var(--accent)]/35 hover:ring-[var(--accent)]/60"
            : "border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--foreground)] hover:border-[var(--border-bright)]"
        }`}
      >
        {icon}
        {cta}
      </Link>
    </div>
  );
}
