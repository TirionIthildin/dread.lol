import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ChartLine,
  Users,
  Globe,
  DeviceMobile,
  ChartBar,
  User,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import { getSession } from "@/lib/auth/session";
import { canUseDashboard } from "@/lib/dashboard-access";
import {
  getOrCreateUser,
  getOrCreateMemberProfile,
  getProfileAnalytics,
} from "@/lib/member-profiles";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { slugFromUsername } from "@/lib/slug";
import DashboardViewsClient from "./DashboardViewsClient";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Profile analytics: who viewed, traffic sources, views over time",
  robots: "noindex, nofollow",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const iconProps = { size: 18, weight: "regular" as const, className: "shrink-0" };

export default async function DashboardAnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/dashboard");
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) redirect("/dashboard");

  const [profile, premiumAccess] = await Promise.all([
    getOrCreateMemberProfile(user.id, {
      name: session.name ?? session.preferred_username ?? "Member",
      slug: slugFromUsername(session.preferred_username ?? session.name ?? session.sub),
      avatarUrl: session.picture ?? undefined,
    }),
    getPremiumAccess(session.sub),
  ]);

  if (!premiumAccess.hasAccess) {
    return (
      <div className="space-y-8">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Analytics</h1>
        <div className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/20 mb-4">
            <ChartLine size={32} weight="duotone" className="text-[var(--accent)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Profile analytics require Premium</h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-md mx-auto">
            See who viewed your profile, traffic sources, views over time, and more.
          </p>
          <Link
            href="/dashboard/premium"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90"
          >
            Get Premium
          </Link>
        </div>
      </div>
    );
  }

  const showViews = profile.showPageViews ?? true;
  const analytics = showViews ? await getProfileAnalytics(profile.id) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Analytics</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <span>Your page:</span>
          <Link
            href={`/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline"
          >
            <ArrowSquareOut {...iconProps} />
            /{profile.slug}
          </Link>
          <DashboardViewsClient slug={profile.slug} />
        </div>
      </div>

      {!showViews ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="text-sm text-[var(--muted)]">
            Page view tracking is disabled for your profile. Enable it in your profile settings to see analytics.
          </p>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[var(--muted)] mb-1">
                <ChartLine {...iconProps} />
                <span className="text-xs font-medium uppercase tracking-wider">Total views</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                {analytics.viewCount.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Unique visitors</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[var(--muted)] mb-1">
                <ChartBar {...iconProps} />
                <span className="text-xs font-medium uppercase tracking-wider">This week</span>
              </div>
              <p className="text-2xl font-bold text-[var(--accent)] tabular-nums">
                {analytics.viewsThisWeek.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Last 7 days</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[var(--muted)] mb-1">
                <Globe {...iconProps} />
                <span className="text-xs font-medium uppercase tracking-wider">Sources</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                {analytics.trafficSources.length}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Traffic sources</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[var(--muted)] mb-1">
                <DeviceMobile {...iconProps} />
                <span className="text-xs font-medium uppercase tracking-wider">Devices</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                {analytics.deviceBreakdown.desktop + analytics.deviceBreakdown.mobile > 0
                  ? (analytics.deviceBreakdown.desktop + analytics.deviceBreakdown.mobile).toLocaleString()
                  : "—"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {analytics.deviceBreakdown.desktop > 0 && `${analytics.deviceBreakdown.desktop} desktop`}
                {analytics.deviceBreakdown.desktop > 0 && analytics.deviceBreakdown.mobile > 0 && " · "}
                {analytics.deviceBreakdown.mobile > 0 && `${analytics.deviceBreakdown.mobile} mobile`}
                {!analytics.deviceBreakdown.desktop && !analytics.deviceBreakdown.mobile && "No data yet"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Who viewed */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
              <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
                <Users {...iconProps} className="text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Who viewed your profile</h2>
              </div>
              <div className="p-4 max-h-[320px] overflow-y-auto">
                {analytics.whoViewed.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] py-4">No views yet. Share your profile to get started.</p>
                ) : (
                  <ul className="space-y-2">
                    {analytics.whoViewed.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--bg)]/50 border border-[var(--border)]/50 hover:border-[var(--border-bright)]/50 transition-colors"
                      >
                        {v.viewerProfile ? (
                          <>
                            <Link href={`/${v.viewerProfile.slug}`} className="shrink-0 rounded-full overflow-hidden ring-1 ring-[var(--border)]">
                              {v.viewerProfile.avatarUrl ? (
                                <Image
                                  src={v.viewerProfile.avatarUrl}
                                  alt=""
                                  width={36}
                                  height={36}
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 bg-[var(--border)] flex items-center justify-center">
                                  <User size={18} weight="regular" className="text-[var(--muted)]" />
                                </div>
                              )}
                            </Link>
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/${v.viewerProfile.slug}`}
                                className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] hover:underline truncate block"
                              >
                                {v.viewerProfile.name}
                              </Link>
                              <p className="text-xs text-[var(--muted)]">{formatDate(v.viewedAt)}</p>
                            </div>
                            <Link
                              href={`/${v.viewerProfile.slug}`}
                              className="shrink-0 text-[var(--accent)] hover:underline text-sm"
                            >
                              View →
                            </Link>
                          </>
                        ) : (
                          <>
                            <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--border)] flex items-center justify-center">
                              <User size={18} weight="regular" className="text-[var(--muted)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[var(--muted)]">Anonymous visitor</p>
                              <p className="text-xs text-[var(--muted)]">{formatDate(v.viewedAt)}</p>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Traffic sources */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
              <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
                <Globe {...iconProps} className="text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Traffic sources</h2>
              </div>
              <div className="p-4">
                {analytics.trafficSources.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] py-4">No traffic data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.trafficSources.slice(0, 10).map(({ source, count }) => {
                      const pct =
                        analytics.viewCount > 0
                          ? Math.round((count / analytics.viewCount) * 100)
                          : 0;
                      return (
                        <div key={source} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-[var(--foreground)]">{source}</span>
                            <span className="text-[var(--muted)] tabular-nums">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--accent)]/80 transition-all"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Views over time */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
            <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
              <ChartLine {...iconProps} className="text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Views over time</h2>
            </div>
            <div className="p-4">
              {analytics.viewsOverTime.every((d) => d.count === 0) ? (
                <p className="text-sm text-[var(--muted)] py-8 text-center">No views in the last 30 days.</p>
              ) : (
                <>
                  <div className="flex items-end gap-px h-32">
                    {analytics.viewsOverTime.map((d) => {
                      const max = Math.max(...analytics.viewsOverTime.map((x) => x.count), 1);
                      const heightPct = max > 0 ? (d.count / max) * 100 : 0;
                      return (
                        <div
                          key={d.date}
                          className="flex-1 min-w-[4px] flex flex-col justify-end"
                          title={`${formatShortDate(d.date)}: ${d.count} view${d.count !== 1 ? "s" : ""}`}
                        >
                          <div
                            className="w-full rounded-t bg-[var(--accent)]/70 hover:bg-[var(--accent)] transition-all min-h-[2px]"
                            style={{ height: `${Math.max(heightPct, d.count > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-[var(--muted)]">
                    <span>{formatShortDate(analytics.viewsOverTime[0]?.date ?? "")}</span>
                    <span>{formatShortDate(analytics.viewsOverTime[analytics.viewsOverTime.length - 1]?.date ?? "")}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Countries (from Cloudflare CF-IPCountry) */}
          {analytics.countries.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
              <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
                <Globe {...iconProps} className="text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Top countries</h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {analytics.countries.map(({ countryCode, count }) => (
                    <div
                      key={countryCode}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                    >
                      <span className="font-mono font-medium text-[var(--foreground)]">{countryCode}</span>
                      <span className="text-[var(--muted)]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Device breakdown */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
            <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
              <DeviceMobile {...iconProps} className="text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Devices</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border border-[var(--border)] p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                    {analytics.deviceBreakdown.desktop}
                  </p>
                  <p className="text-xs text-[var(--muted)]">Desktop</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                    {analytics.deviceBreakdown.mobile}
                  </p>
                  <p className="text-xs text-[var(--muted)]">Mobile</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                    {analytics.deviceBreakdown.bot}
                  </p>
                  <p className="text-xs text-[var(--muted)]">Bots</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                    {analytics.deviceBreakdown.unknown}
                  </p>
                  <p className="text-xs text-[var(--muted)]">Unknown</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">Loading analytics…</p>
      )}
    </div>
  );
}
