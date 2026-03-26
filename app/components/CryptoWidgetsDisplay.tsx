import { Coins } from "lucide-react";
import type { CryptoWidgetData } from "@/lib/crypto-widgets";

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatNative(chain: CryptoWidgetData["chain"], amount: number): string {
  const maxFrac = chain === "ethereum" || chain === "solana" ? 6 : 8;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  }).format(amount);
}

interface CryptoWidgetsDisplayProps {
  wallets: CryptoWidgetData[];
  /** When true, use accent color for borders/icons. */
  matchAccent?: boolean;
}

export default function CryptoWidgetsDisplay({ wallets, matchAccent = false }: CryptoWidgetsDisplayProps) {
  if (!wallets.length) return null;

  const widgetBase = matchAccent
    ? "crypto-widget-card flex flex-col gap-0.5 rounded-lg border border-[var(--accent)]/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-[var(--accent)]/40 min-w-[12rem] flex-1 sm:flex-initial sm:min-w-[14rem]"
    : "crypto-widget-card flex flex-col gap-0.5 rounded-lg border border-amber-500/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-amber-500/40 min-w-[12rem] flex-1 sm:flex-initial sm:min-w-[14rem]";
  const labelClass = "text-[10px] font-medium uppercase tracking-wider";
  const accentIcon = matchAccent ? "var(--accent)" : "#f59e0b";

  return (
    <div className="flex flex-wrap gap-2" role="region" aria-label="Wallet balances">
      {wallets.map((data) => (
        <div key={data.chain} className={widgetBase}>
          <div className="flex items-start gap-2">
            <Coins size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" style={{ color: accentIcon }} aria-hidden />
            <div className="min-w-0">
              <p className={`${labelClass} ${matchAccent ? "text-[var(--accent)]/80" : "text-amber-600/90 dark:text-amber-400/90"}`}>
                {data.networkLabel}{" "}
                <span className="text-[var(--muted)] font-normal normal-case tracking-normal">({data.symbol})</span>
              </p>
              <p className="text-xs text-[var(--muted)] font-mono truncate" title={data.address}>
                {data.addressShort}
              </p>
              <p className="text-[var(--foreground)] font-semibold tabular-nums mt-1">
                {formatNative(data.chain, data.balanceNative)} {data.symbol}
              </p>
              {data.balanceUsd != null && Number.isFinite(data.balanceUsd) && (
                <p className="text-xs text-[var(--muted)] tabular-nums">≈ {formatUsd(data.balanceUsd)}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
