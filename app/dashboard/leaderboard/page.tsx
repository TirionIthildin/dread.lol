import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboardTopVouches } from "@/lib/member-profiles";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Leaderboard — ${SITE_NAME}`,
  description: `Top vouched profiles this month on ${SITE_NAME}`,
  openGraph: {
    title: `Leaderboard — ${SITE_NAME}`,
    url: `${SITE_URL}/dashboard/leaderboard`,
  },
};

export default async function DashboardLeaderboardPage() {
  const leaderboard = await getLeaderboardTopVouches(20);
  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Top vouches this month
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {monthName} {year}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]/95">
        <div className="divide-y divide-[var(--border)]/50">
          {leaderboard.length === 0 ? (
            <p className="px-4 py-8 text-sm text-[var(--muted)] text-center">
              No vouches yet this month. Be the first to vouch someone!
            </p>
          ) : (
            leaderboard.map((entry, i) => (
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
                <span className="shrink-0 text-sm text-[var(--muted)]">
                  {entry.count} {entry.count === 1 ? "vouch" : "vouches"}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
