"use client";

import { CreditCard } from "@phosphor-icons/react";

type Props = {
  daysRemaining: number;
  trialEndDate: Date;
  basicTierName?: string;
  basicPriceFormatted?: string | null;
};

export default function BasicTrialBanner({
  daysRemaining,
  trialEndDate,
  basicTierName = "Basic",
  basicPriceFormatted = "$4",
}: Props) {
  const endStr = trialEndDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-sm"
      role="status"
    >
      <p className="text-[var(--foreground)]">
        You have{" "}
        <span className="font-semibold">
          {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
        </span>{" "}
        left in your free trial. Pay {basicPriceFormatted} for {basicTierName} before {endStr} to
        keep your account.
      </p>
      <a
        href="https://dread.lol/api/polar/checkout-basic"
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/15 px-3 py-2 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/25"
      >
        <CreditCard size={16} weight="regular" />
        Pay {basicPriceFormatted} for {basicTierName}
      </a>
    </div>
  );
}
