import { Coins } from "@phosphor-icons/react/dist/ssr";
import type { CryptoWidgetData } from "@/lib/crypto-widgets";

function formatUsd(n: number): string {
  if (n >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(n);
}

interface CryptoWidgetsDisplayProps {
  data: CryptoWidgetData;
  /** When true, use accent color for borders/icons. */
  matchAccent?: boolean;
}

export default function CryptoWidgetsDisplay({ data, matchAccent = false }: CryptoWidgetsDisplayProps) {
  const { coins } = data;
  if (!coins.length) return null;

  const widgetBase = matchAccent
    ? "crypto-widget-card flex flex-col gap-0.5 rounded-lg border border-[var(--accent)]/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-[var(--accent)]/40 min-w-[7.5rem] flex-1 sm:flex-initial sm:min-w-[8.5rem]"
    : "crypto-widget-card flex flex-col gap-0.5 rounded-lg border border-amber-500/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-amber-500/40 min-w-[7.5rem] flex-1 sm:flex-initial sm:min-w-[8.5rem]";
  const labelClass = "text-[10px] font-medium uppercase tracking-wider";
  const accentIcon = matchAccent ? "var(--accent)" : "#f59e0b";

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Cryptocurrency spot prices">
      {coins.map((c) => {
        const change = c.change24hPct;
        const changeStr =
          change != null && Number.isFinite(change)
            ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
            : null;
        const positive = change != null && change >= 0;
        return (
          <div key={c.id} className={widgetBase} role="listitem">
            <div className="flex items-center gap-2">
              <Coins size={18} weight="duotone" className="shrink-0" style={{ color: accentIcon }} aria-hidden />
              <div className="min-w-0">
                <p className={`${labelClass} ${matchAccent ? "text-[var(--accent)]/80" : "text-amber-600/90 dark:text-amber-400/90"}`}>
                  {c.name}{" "}
                  <span className="text-[var(--muted)] font-normal normal-case tracking-normal">({c.symbol})</span>
                </p>
                <p className="text-[var(--foreground)] font-semibold tabular-nums">{formatUsd(c.priceUsd)}</p>
                {changeStr != null && (
                  <p
                    className={`text-xs font-medium tabular-nums ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    24h {changeStr}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
