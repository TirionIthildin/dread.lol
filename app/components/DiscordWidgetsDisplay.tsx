import Link from "next/link";
import { DiscordLogo, ArrowSquareOut, CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import type { DiscordWidgetData } from "@/lib/discord-widgets";

/** Normalize widget data from server (Dates may be ISO strings). */
export function normalizeWidgetData(data: DiscordWidgetData | null | undefined): DiscordWidgetData | null {
  if (!data) return null;
  const out: DiscordWidgetData = {};
  if (data.accountAge) {
    const createdAt =
      typeof data.accountAge.createdAt === "string"
        ? new Date(data.accountAge.createdAt)
        : data.accountAge.createdAt;
    out.accountAge = { createdAt, label: data.accountAge.label };
  }
  if (data.joined) {
    const createdAt =
      typeof data.joined.createdAt === "string"
        ? new Date(data.joined.createdAt)
        : data.joined.createdAt;
    out.joined = { createdAt, label: data.joined.label };
  }
  if (data.serverCount != null) out.serverCount = data.serverCount;
  if (data.serverInvite) out.serverInvite = data.serverInvite;
  return out;
}

interface DiscordWidgetsDisplayProps {
  data: DiscordWidgetData;
  /** When true, use accent color instead of Discord brand color. */
  matchAccent?: boolean;
}

export default function DiscordWidgetsDisplay({ data, matchAccent = false }: DiscordWidgetsDisplayProps) {
  const accent = matchAccent ? "var(--accent)" : "#5865F2";
  const discordIconProps = { size: 18, weight: "fill" as const, className: "shrink-0", style: { color: accent } };
  const joinedIconProps = { size: 18, weight: "regular" as const, className: "shrink-0 text-[var(--accent)]" };
  const labelClass = "discord-widget-label text-[10px] font-medium uppercase tracking-wider";
  const joinedLabelClass = "discord-widget-label text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]";
  const widgets: React.ReactNode[] = [];

  const widgetBase = matchAccent
    ? "discord-widget-card flex items-center gap-2.5 rounded-lg border border-[var(--accent)]/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors"
    : "discord-widget-card flex items-center gap-2.5 rounded-lg border border-[#5865F2]/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors";
  const hoverClass = matchAccent ? "hover:border-[var(--accent)]/40" : "hover:border-[#5865F2]/40";
  const linkHoverClass = matchAccent ? "hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10" : "hover:border-[#5865F2]/50 hover:bg-[#5865F2]/10";
  const joinedWidgetBase = "discord-widget-card flex items-center gap-2.5 rounded-lg border border-[var(--border)]/50 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-[var(--border-bright)]/50";

  if (data.accountAge) {
    const createdAt =
      data.accountAge.createdAt instanceof Date
        ? data.accountAge.createdAt
        : new Date(data.accountAge.createdAt as string);
    const accountAgeTitle =
      !isNaN(createdAt.getTime()) ? `Discord account since ${createdAt.toLocaleDateString()}` : "Discord account age";
    widgets.push(
      <div
        key="accountAge"
        className={`${widgetBase} ${hoverClass}`}
        title={accountAgeTitle}
      >
        <DiscordLogo {...discordIconProps} aria-hidden />
        <div>
          <p className={labelClass} style={matchAccent ? { color: "var(--accent)" } : { color: "rgba(88, 101, 242, 0.8)" }}>Account age</p>
          <p className="text-[var(--foreground)] font-medium">{data.accountAge.label}</p>
        </div>
      </div>
    );
  }

  if (data.joined) {
    const createdAt =
      data.joined.createdAt instanceof Date ? data.joined.createdAt : new Date(data.joined.createdAt as string);
    const joinedTitle =
      !isNaN(createdAt.getTime()) ? `Joined Dread.lol on ${createdAt.toLocaleDateString()}` : "Joined Dread.lol";
    widgets.push(
      <div key="joined" className={`${joinedWidgetBase}`} title={joinedTitle}>
        <CalendarBlank {...joinedIconProps} aria-hidden />
        <div>
          <p className={joinedLabelClass}>Joined</p>
          <p className="text-[var(--foreground)] font-medium">{data.joined.label}</p>
        </div>
      </div>
    );
  }

  if (data.serverCount != null) {
    widgets.push(
      <div
        key="serverCount"
        className={`${widgetBase} ${hoverClass}`}
        title="Number of Discord servers this user is in"
      >
        <DiscordLogo {...discordIconProps} aria-hidden />
        <div>
          <p className={labelClass} style={matchAccent ? { color: "var(--accent)" } : { color: "rgba(88, 101, 242, 0.8)" }}>Servers</p>
          <p className="text-[var(--foreground)] font-medium">
            {data.serverCount} server{data.serverCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    );
  }

  if (data.serverInvite) {
    const guildPart = data.serverInvite.guildName ?? "my Discord";
    const countPart = data.serverInvite.memberCount != null ? ` · ${data.serverInvite.memberCount.toLocaleString()} members` : "";
    const label = `Join ${guildPart}${countPart}`;
    const isPlaceholder = data.serverInvite.url === "#";
    const content = (
      <>
        <DiscordLogo {...discordIconProps} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={labelClass} style={matchAccent ? { color: "var(--accent)" } : { color: "rgba(88, 101, 242, 0.8)" }}>Join server</p>
          <p className="font-medium truncate">{label}</p>
        </div>
        {!isPlaceholder && (
          <ArrowSquareOut size={14} weight="regular" className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden />
        )}
      </>
    );
    widgets.push(
      isPlaceholder ? (
        <div
          key="serverInvite"
          className={`${widgetBase} opacity-80 text-[var(--foreground)]`}
        >
          {content}
        </div>
      ) : (
        <Link
          key="serverInvite"
          href={data.serverInvite.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${widgetBase} text-[var(--foreground)] ${linkHoverClass} group`}
        >
          {content}
        </Link>
      )
    );
  }

  if (widgets.length === 0) return null;

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}
      role="group"
      aria-label="Discord info"
    >
      {widgets}
    </div>
  );
}
