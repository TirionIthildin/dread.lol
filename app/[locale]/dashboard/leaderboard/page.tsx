import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboardTopVouches, getLeaderboardTopViews } from "@/lib/member-profiles";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Leaderboard — ${SITE_NAME}`,
  description: `Top vouched and most viewed profiles on ${SITE_NAME}`,
  openGraph: {
    title: `Leaderboard — ${SITE_NAME}`,
    url: `${SITE_URL}/dashboard/leaderboard`,
  },
};

type LeaderboardEntry = { slug: string; name: string; count: number };

function LeaderboardList({
  entries,
  emptyMessage,
  countLabel,
}: {
  entries: LeaderboardEntry[];
  emptyMessage: string;
  countLabel: (n: number) => string;
}) {
  return (
    <div className="divide-y divide-[var(--border)]/50">
      {entries.length === 0 ? (
        <p className="px-4 py-8 text-sm text-[var(--muted)] text-center">{emptyMessage}</p>
      ) : (
        entries.map((entry, i) => (
          <Link
            key={entry.slug}
            href={`/${entry.slug}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg)]/50 transition-colors"
          >
            <span
              className={`shrink-0 w-7 text-right font-mono text-sm font-medium ${
                i === 0 ? "text-amber-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-amber-700" : "text-[var(--muted)]"
              }`}
            >
              #{i + 1}
            </span>
            <span className="flex-1 min-w-0 truncate font-medium text-[var(--foreground)]">
              {entry.name || entry.slug}
            </span>
            <span className="shrink-0 text-sm text-[var(--muted)]">{countLabel(entry.count)}</span>
          </Link>
        ))
      )}
    </div>
  );
}

export default async function DashboardLeaderboardPage() {
  let vouchesLeaderboard: LeaderboardEntry[] = [];
  let viewsLeaderboard: LeaderboardEntry[] = [];
  try {
    [vouchesLeaderboard, viewsLeaderboard] = await Promise.all([
      getLeaderboardTopVouches(20),
      getLeaderboardTopViews(20),
    ]);
  } catch {
    // MongoDB unavailable (e.g. during Docker build or CI)
  }
  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Leaderboard</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Top vouched and most viewed profiles. Vouches reset monthly; views are all-time.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-[var(--foreground)]">Top vouches this month</h2>
        <p className="text-sm text-[var(--muted)]">
          {monthName} {year}
        </p>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]/95">
          <LeaderboardList
            entries={vouchesLeaderboard}
            emptyMessage="No vouches yet this month. Be the first to vouch someone!"
            countLabel={(n) => `${n} ${n === 1 ? "vouch" : "vouches"}`}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-[var(--foreground)]">Most viewed profiles</h2>
        <p className="text-sm text-[var(--muted)]">All-time unique visitors</p>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]/95">
          <LeaderboardList
            entries={viewsLeaderboard}
            emptyMessage="No profile views yet."
            countLabel={(n) => `${n} ${n === 1 ? "view" : "views"}`}
          />
        </div>
      </section>
    </div>
  );
}
