"use client";

import { DiscordLogo, CreditCard } from "@phosphor-icons/react";

const DISCORD_INVITE = "https://discord.gg/sHN28UTbh6";

type Props = {
  /** When true, show Basic paywall ($4 one-time) instead of Discord message. */
  basicEnabled?: boolean;
  basicTierName?: string;
  basicPriceCents?: number;
};

export default function UnapprovedMessage({
  basicEnabled = false,
  basicTierName = "Basic",
  basicPriceCents = 400,
}: Props) {
  const priceDisplay = `$${(basicPriceCents / 100).toFixed(0)}`;

  if (basicEnabled) {
    return (
      <div
        className="animate-fade-in-up rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
        role="status"
      >
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Pay {priceDisplay} one-time for {basicTierName} to unlock your account and start building your profile.
        </p>
        <a
          href="/api/polar/checkout-basic"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
        >
          <CreditCard size={20} weight="regular" className="shrink-0" aria-hidden />
          Pay {priceDisplay} for {basicTierName}
        </a>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in-up rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
      role="status"
    >
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Account pending approval
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Your account is not yet approved. Join our Discord to learn how to get an account and to request access.
      </p>
      <a
        href={DISCORD_INVITE}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#5865F2]/15 px-4 py-2.5 text-sm font-medium text-[#5865F2] transition-colors hover:bg-[#5865F2]/25 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
      >
        <DiscordLogo size={20} weight="fill" className="shrink-0 text-[#5865F2]" aria-hidden />
        Join Discord to get access
      </a>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Discord invite:{" "}
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          discord.gg/sHN28UTbh6
        </a>
      </p>
    </div>
  );
}
