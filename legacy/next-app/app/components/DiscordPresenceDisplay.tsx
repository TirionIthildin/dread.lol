/**
 * Discord status + Rich Presence display with multiple visual variants.
 * Activity types: 0 Playing, 1 Streaming, 2 Listening, 3 Watching, 4 Custom, 5 Competing.
 */
import type { Profile } from "@/lib/profiles";

export type DiscordPresenceStyle =
  | "pills"      // Status pill + activity pills
  | "minimal"    // Subtle dot + text, activities as muted line
  | "stacked"    // Status badge + activities in stacked cards
  | "inline"     // Single condensed row
  | "widget";    // Unified card widget (status + activities in one bordered container)

interface DiscordPresenceDisplayProps {
  presence: NonNullable<Profile["discordPresence"]>;
  /** Display variant. Default: pills */
  style?: DiscordPresenceStyle;
}

const STATUS_COLORS = {
  online: {
    bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  idle: {
    bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  dnd: {
    bg: "bg-red-500/15 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  offline: {
    bg: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
    dot: "bg-zinc-500",
  },
} as const;

function getActivityIcon(activity: { name: string; type?: number }): string {
  const name = (activity.name ?? "").toLowerCase();
  if (name.includes("spotify") || name.includes("listening") || activity.type === 2) return "♪";
  if (activity.type === 1) return "▶"; // Streaming
  if (activity.type === 3) return "▶"; // Watching
  if (activity.type === 5) return "🏆"; // Competing
  return "▶"; // Playing, Custom, default
}

function formatActivity(activity: { name: string; state?: string | null; details?: string | null }): string {
  const parts = [activity.name];
  if (activity.state) parts.push(activity.state);
  if (activity.details && activity.details !== activity.state) parts.push(activity.details);
  return parts.join(" — ");
}

/** Status pill + activity pills — bold, prominent (current design) */
function PillsVariant({ presence }: { presence: NonNullable<Profile["discordPresence"]> }) {
  const statusColors = STATUS_COLORS[presence.status];
  const activities = presence.activities?.slice(0, 2) ?? [];

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-2">
      <span
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors.bg}`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColors.dot}`} aria-hidden />
        <span className="capitalize">{presence.status}</span>
      </span>
      {activities.map((a, i) => (
        <span
          key={i}
          className="inline-flex items-start gap-1.5 rounded-lg border border-[var(--border)]/60 bg-[var(--bg)]/50 px-2.5 py-1 text-xs text-[var(--foreground)]/90 min-w-0"
          title={formatActivity(a)}
        >
          <span className="shrink-0 text-[var(--muted)] mt-0.5" aria-hidden>
            {getActivityIcon(a)}
          </span>
          <span className="break-words min-w-0">
            {a.name}
            {(a.state || a.details) && (
              <span className="text-[var(--muted)]"> — {a.state || a.details}</span>
            )}
          </span>
        </span>
      ))}
    </div>
  );
}

/** Minimal — dot only, status + activities in a subtle single line */
function MinimalVariant({ presence }: { presence: NonNullable<Profile["discordPresence"]> }) {
  const statusColors = STATUS_COLORS[presence.status];
  const activities = presence.activities ?? [];
  const activityText = activities.length > 0
    ? activities.map((a) => formatActivity(a)).join(" · ")
    : null;

  return (
    <div className="inline-flex flex-wrap items-center gap-2 text-xs text-[var(--foreground)]/80">
      <span className="inline-flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColors.dot}`} aria-hidden />
        <span className="capitalize">{presence.status}</span>
      </span>
      {activityText && (
        <>
          <span className="text-[var(--muted)]">·</span>
          <span className="text-[var(--muted)] max-w-[280px] truncate" title={activityText}>
            {activityText}
          </span>
        </>
      )}
    </div>
  );
}

/** Stacked — status on top, activities as separate cards below */
function StackedVariant({ presence }: { presence: NonNullable<Profile["discordPresence"]> }) {
  const statusColors = STATUS_COLORS[presence.status];
  const activities = presence.activities ?? [];

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <span
        className={`w-fit inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${statusColors.bg}`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${statusColors.dot}`} aria-hidden />
        <span className="capitalize">{presence.status}</span>
      </span>
      {activities.length > 0 && (
        <div className="flex w-full min-w-0 flex-col gap-1.5">
          {activities.slice(0, 3).map((a, i) => (
            <div
              key={i}
              className="w-full min-w-0 rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/40 px-3 py-2 text-xs"
              title={formatActivity(a)}
            >
              <span className="text-[var(--muted)] mr-1.5" aria-hidden>
                {getActivityIcon(a)}
              </span>
              <span className="text-[var(--foreground)]/90">{a.name}</span>
              {(a.state || a.details) && (
                <span className="text-[var(--muted)] block mt-0.5 pl-5">
                  {a.state || a.details}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Inline — everything in one condensed row, comma-separated */
function InlineVariant({ presence }: { presence: NonNullable<Profile["discordPresence"]> }) {
  const statusColors = STATUS_COLORS[presence.status];
  const activities = presence.activities ?? [];
  const parts: string[] = [presence.status];
  activities.forEach((a) => parts.push(formatActivity(a)));

  return (
    <div
      className="inline-flex items-center gap-1.5 text-xs text-[var(--foreground)]/85"
      title={parts.join(" · ")}
    >
      <span className={`h-1 w-1 shrink-0 rounded-full ${statusColors.dot}`} aria-hidden />
      <span className="truncate max-w-[320px]">
        {parts.join(", ")}
      </span>
    </div>
  );
}

/** Unified widget — status + activities in a single bordered card */
function WidgetVariant({ presence }: { presence: NonNullable<Profile["discordPresence"]> }) {
  const statusColors = STATUS_COLORS[presence.status];
  const activities = presence.activities?.slice(0, 3) ?? [];

  return (
    <div
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--border)]/60 bg-[var(--bg)]/50 shadow-sm"
      role="status"
      aria-label={`Discord: ${presence.status}${activities.length ? `, ${activities.map((a) => a.name).join(", ")}` : ""}`}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)]/40 px-3 py-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${statusColors.dot}`} aria-hidden />
        <span className="text-xs font-medium capitalize text-[var(--foreground)]/90">{presence.status}</span>
        <span className="text-[10px] text-[var(--muted)]">· Discord</span>
      </div>
      {activities.length > 0 ? (
        <div className="flex w-full min-w-0 flex-col divide-y divide-[var(--border)]/30">
          {activities.map((a, i) => (
            <div
              key={i}
              className="flex w-full min-w-0 items-start gap-2 px-3 py-2 text-xs"
              title={formatActivity(a)}
            >
              <span className="shrink-0 text-[var(--muted)] mt-0.5" aria-hidden>
                {getActivityIcon(a)}
              </span>
              <span className="min-w-0 break-words">
                <span className="text-[var(--foreground)]/90">{a.name}</span>
                {(a.state || a.details) && (
                  <span className="text-[var(--muted)]"> — {a.state || a.details}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3 py-2 text-xs text-[var(--muted)]">No activity</div>
      )}
    </div>
  );
}

export default function DiscordPresenceDisplay({ presence, style = "pills" }: DiscordPresenceDisplayProps) {
  switch (style) {
    case "minimal":
      return <MinimalVariant presence={presence} />;
    case "stacked":
      return <StackedVariant presence={presence} />;
    case "inline":
      return <InlineVariant presence={presence} />;
    case "widget":
      return <WidgetVariant presence={presence} />;
    case "pills":
    default:
      return <PillsVariant presence={presence} />;
  }
}
