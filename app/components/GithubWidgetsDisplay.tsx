import Link from "next/link";
import { ArrowSquareOut, GithubLogo } from "@phosphor-icons/react/dist/ssr";
import type { GithubWidgetData, GithubWidgetType } from "@/lib/github-widgets";

const labelClass = "text-[10px] font-medium uppercase tracking-wider";

const GITHUB_WIDGET_ORDER: GithubWidgetType[] = ["lastPush", "publicRepos", "contributions"];

function parseGithubOrder(raw: string | undefined): string[] {
  if (!raw?.trim()) return [...GITHUB_WIDGET_ORDER];
  const map: Record<string, GithubWidgetType> = {
    lastpush: "lastPush",
    publicrepos: "publicRepos",
    contributions: "contributions",
    profile: "profile",
  };
  return raw
    .split(",")
    .map((s) => map[s.trim().toLowerCase()])
    .filter(Boolean) as string[];
}

function formatRelativePush(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function cellIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

interface GithubWidgetsDisplayProps {
  data: GithubWidgetData;
  matchAccent?: boolean;
  orderFromCsv?: string;
}

export default function GithubWidgetsDisplay({ data, matchAccent = false, orderFromCsv }: GithubWidgetsDisplayProps) {
  const resolvedOrder = orderFromCsv ? parseGithubOrder(orderFromCsv) : [...GITHUB_WIDGET_ORDER];
  const widgetMap: Record<string, React.ReactNode> = {};

  const widgetBase = matchAccent
    ? "github-widget-card flex items-center gap-2.5 rounded-lg border border-[var(--accent)]/25 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-[var(--accent)]/40"
    : "github-widget-card flex items-center gap-2.5 rounded-lg border border-[var(--border)]/60 bg-[var(--surface)]/50 dark:bg-[var(--bg)]/60 px-3 py-2.5 text-sm transition-colors hover:border-[var(--border)]";

  const iconColor = matchAccent ? "var(--accent)" : "#f0f6fc";
  const labelColorClass = matchAccent ? "text-[var(--accent)]/80" : "text-[#8b949e]";
  const linkHoverClass = matchAccent
    ? "hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10"
    : "hover:border-[var(--border)]/80 hover:bg-[var(--surface)]/80";

  const githubGreen = (level: 0 | 1 | 2 | 3 | 4) => {
    if (matchAccent) {
      const op = level === 0 ? 0.12 : 0.15 + level * 0.15;
      return { backgroundColor: `color-mix(in srgb, var(--accent) ${Math.round(op * 100)}%, transparent)` };
    }
    const map: Record<number, string> = {
      0: "rgba(27, 31, 35, 0.5)",
      1: "#0e4429",
      2: "#006d32",
      3: "#26a641",
      4: "#39d353",
    };
    return { backgroundColor: map[level] ?? map[0] };
  };

  if (data.lastPush) {
    const rel = formatRelativePush(data.lastPush.at);
    const title = data.lastPush.repoName ? `Last push to ${data.lastPush.repoName}` : "Last public activity";
    widgetMap["lastPush"] = (
      <div className={widgetBase} title={title}>
        <span className="shrink-0" style={{ color: iconColor }}>
          <GithubLogo size={18} weight="fill" className="block" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className={`${labelClass} ${labelColorClass}`}>Last push</p>
          <p className="text-[var(--foreground)] font-medium truncate">{rel}</p>
        </div>
      </div>
    );
  }

  if (data.publicRepos != null) {
    widgetMap["publicRepos"] = (
      <div className={widgetBase} title="Public repositories">
        <span className="shrink-0" style={{ color: iconColor }}>
          <GithubLogo size={18} weight="fill" className="block" aria-hidden />
        </span>
        <div>
          <p className={`${labelClass} ${labelColorClass}`}>Public repos</p>
          <p className="text-[var(--foreground)] font-medium">{data.publicRepos}</p>
        </div>
      </div>
    );
  }

  if (data.profileUrl) {
    widgetMap["profile"] = (
      <Link
        href={data.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${widgetBase} text-[var(--foreground)] ${linkHoverClass} group`}
        aria-label="Open GitHub profile"
      >
        {data.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.avatarUrl}
            alt=""
            width={36}
            height={36}
            className="rounded-full shrink-0 object-cover"
            referrerPolicy="no-referrer"
            aria-hidden
          />
        ) : (
          <span className="shrink-0" style={{ color: iconColor }}>
            <GithubLogo size={18} weight="fill" className="block" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`${labelClass} ${labelColorClass}`}>GitHub</p>
          <p className="font-medium truncate">View profile</p>
        </div>
        <ArrowSquareOut
          size={14}
          weight="regular"
          className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
          aria-hidden
        />
      </Link>
    );
  }

  if (data.contributions) {
    const { total, heatmap } = data.contributions;
    widgetMap["contributions"] = (
      <div className={`${widgetBase} flex-col items-stretch gap-2 w-full`} title="Contributions on GitHub (last year)">
        <div className="flex items-center gap-2.5 w-full">
          <span className="shrink-0" style={{ color: iconColor }}>
            <GithubLogo size={18} weight="fill" className="block" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`${labelClass} ${labelColorClass}`}>Contributions</p>
            <p className="text-[var(--foreground)] font-medium">{total.toLocaleString()} in the last year</p>
          </div>
        </div>
        {heatmap.length > 0 && (
          <div className="flex flex-col gap-0.5 w-full" role="img" aria-label="Contribution activity, last four weeks">
            {heatmap.map((week, wi) => (
              <div key={wi} className="grid w-full gap-0.5" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                {week.map((count, di) => (
                  <span
                    key={di}
                    className="aspect-square rounded-[2px] min-h-[8px]"
                    style={githubGreen(cellIntensity(count))}
                    title={`${count} contributions`}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <p className="text-[9px] text-[var(--muted)]">Last 4 weeks</p>
      </div>
    );
  } else if (data.contributionsUnavailable) {
    widgetMap["contributions"] = (
      <div
        className={widgetBase}
        title="Contribution totals need a server-side GitHub token (GITHUB_TOKEN)"
      >
        <span className="shrink-0" style={{ color: iconColor }}>
          <GithubLogo size={18} weight="fill" className="block" aria-hidden />
        </span>
        <div>
          <p className={`${labelClass} ${labelColorClass}`}>Contributions</p>
          <p className="text-xs text-[var(--muted)]">Graph unavailable (host not configured)</p>
        </div>
      </div>
    );
  }

  const orderedIds = resolvedOrder.filter((id) => widgetMap[id] != null);
  if (orderedIds.length === 0) return null;

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}
      role="group"
      aria-label="GitHub info"
    >
      {orderedIds.map((id) => (
        <div key={id}>{widgetMap[id]}</div>
      ))}
    </div>
  );
}
