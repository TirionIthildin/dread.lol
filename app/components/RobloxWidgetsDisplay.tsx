import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { RobloxWidgetData } from "@/lib/roblox-widgets";

const labelClass = "text-[10px] font-medium uppercase tracking-wider";
const ROBLOX_WIDGET_ORDER = ["accountAge", "profile"] as const;

function parseRobloxOrder(raw: string | undefined): string[] {
  if (!raw?.trim()) return [...ROBLOX_WIDGET_ORDER];
  const map: Record<string, string> = {
    accountage: "accountAge",
    profile: "profile",
  };
  return raw
    .split(",")
    .map((s) => map[s.trim().toLowerCase()])
    .filter(Boolean);
}

interface RobloxWidgetsDisplayProps {
  data: RobloxWidgetData;
  /** When true, use accent color instead of Roblox brand color. */
  matchAccent?: boolean;
  /** Override order from CSV (profile.showRobloxWidgets). */
  orderFromCsv?: string;
}

function RobloxIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.09 8 12 11.82 4.91 8 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
    </svg>
  );
}

function RobloxAvatar({ avatarUrl, size = 36 }: { avatarUrl: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt=""
      width={size}
      height={size}
      className="rounded-full shrink-0 object-cover"
      referrerPolicy="no-referrer"
      aria-hidden
    />
  );
}

export default function RobloxWidgetsDisplay({ data, matchAccent = false, orderFromCsv }: RobloxWidgetsDisplayProps) {
  const resolvedOrder = orderFromCsv ? parseRobloxOrder(orderFromCsv) : [...ROBLOX_WIDGET_ORDER];
  const widgetMap: Record<string, React.ReactNode> = {};
  const widgetBase = matchAccent
    ? "roblox-widget-card flex items-center gap-2.5 rounded-lg border border-[var(--accent)]/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-[var(--accent)]/40"
    : "roblox-widget-card flex items-center gap-2.5 rounded-lg border border-[#00A2FF]/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-[#00A2FF]/40";
  const iconColor = matchAccent ? "var(--accent)" : "#00A2FF";
  const labelColorClass = matchAccent ? "text-[var(--accent)]/80" : "text-[#00A2FF]/80";
  const linkHoverClass = matchAccent ? "hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10" : "hover:border-[#00A2FF]/50 hover:bg-[#00A2FF]/10";

  if (data.accountAge) {
    const createdAt = data.accountAge.createdAt instanceof Date
      ? data.accountAge.createdAt
      : new Date(data.accountAge.createdAt as string);
    const title = !isNaN(createdAt.getTime())
      ? `Roblox account since ${createdAt.toLocaleDateString()}`
      : "Roblox account age";
    widgetMap["accountAge"] = (
      <div className={widgetBase} title={title}>
        <span className="shrink-0" style={{ color: iconColor }}>
          <RobloxIcon className="block" />
        </span>
        <div>
          <p className={`${labelClass} ${labelColorClass}`}>Account age</p>
          <p className="text-[var(--foreground)] font-medium">
            {data.accountAge.label}
          </p>
        </div>
      </div>
    );
  }

  if (data.profile) {
    const label = data.profile.displayName || data.profile.username || "View profile";
    widgetMap["profile"] = (
        <Link
        href={data.profile.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${widgetBase} text-[var(--foreground)] ${linkHoverClass} group`}
        aria-label={`Open Roblox profile for ${data.profile.displayName || data.profile.username}`}
      >
        {data.profile.avatarUrl ? (
          <RobloxAvatar avatarUrl={data.profile.avatarUrl} />
        ) : (
          <span className="shrink-0" style={{ color: iconColor }}>
            <RobloxIcon className="block" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`${labelClass} ${labelColorClass}`}>Roblox</p>
          <p className="font-medium truncate">{label}</p>
        </div>
        <ExternalLink
          size={14}
          strokeWidth={1.5}
          className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
          aria-hidden
        />
      </Link>
    );
  }

  const orderedIds = resolvedOrder.filter((id) => widgetMap[id] != null);
  if (orderedIds.length === 0) return null;

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}
      role="group"
      aria-label="Roblox info"
    >
      {orderedIds.map((id) => (
        <div key={id}>{widgetMap[id]}</div>
      ))}
    </div>
  );
}

/** Renders a single Roblox widget by id. Used for sortable grid. */
export function RobloxSingleWidget({
  id,
  data,
  matchAccent = false,
}: {
  id: string;
  data: RobloxWidgetData;
  matchAccent?: boolean;
}) {
  const widgetBase = matchAccent
    ? "roblox-widget-card flex items-center gap-2.5 rounded-lg border border-[var(--accent)]/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-[var(--accent)]/40"
    : "roblox-widget-card flex items-center gap-2.5 rounded-lg border border-[#00A2FF]/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-[#00A2FF]/40";
  const iconColor = matchAccent ? "var(--accent)" : "#00A2FF";
  const labelColorClass = matchAccent ? "text-[var(--accent)]/80" : "text-[#00A2FF]/80";
  const linkHoverClass = matchAccent ? "hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10" : "hover:border-[#00A2FF]/50 hover:bg-[#00A2FF]/10";

  if (id === "accountAge" && data.accountAge) {
    const createdAt = data.accountAge.createdAt instanceof Date ? data.accountAge.createdAt : new Date(data.accountAge.createdAt as string);
    const title = !isNaN(createdAt.getTime()) ? `Roblox account since ${createdAt.toLocaleDateString()}` : "Roblox account age";
    return (
      <div className={widgetBase} title={title}>
        <span className="shrink-0" style={{ color: iconColor }}>
          <RobloxIcon className="block" />
        </span>
        <div>
          <p className={`${labelClass} ${labelColorClass}`}>Account age</p>
          <p className="text-[var(--foreground)] font-medium">{data.accountAge.label}</p>
        </div>
      </div>
    );
  }
  if (id === "profile" && data.profile) {
    const label = data.profile.displayName || data.profile.username || "View profile";
    return (
      <Link
        href={data.profile.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${widgetBase} text-[var(--foreground)] ${linkHoverClass} group`}
        aria-label={`Open Roblox profile for ${data.profile.displayName || data.profile.username}`}
      >
        {data.profile.avatarUrl ? (
          <RobloxAvatar avatarUrl={data.profile.avatarUrl} />
        ) : (
          <span className="shrink-0" style={{ color: iconColor }}>
            <RobloxIcon className="block" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`${labelClass} ${labelColorClass}`}>Roblox</p>
          <p className="font-medium truncate">{label}</p>
        </div>
        <ExternalLink size={14} strokeWidth={1.5} className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden />
      </Link>
    );
  }
  return null;
}
