import type { Metadata } from "next";
import Link from "next/link";
import { getTrendingProfiles } from "@/lib/member-profiles";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Trending — ${SITE_NAME}`,
  description: `Profiles trending this week on ${SITE_NAME}`,
  openGraph: {
    title: `Trending — ${SITE_NAME}`,
    url: `${SITE_URL}/trending`,
  },
};

export default async function TrendingPage() {
  const trending = await getTrendingProfiles(15);

  return (
    <div className="relative z-10 w-full max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-auto">
      <div className="rounded-xl border border-[var(--border)] shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden bg-[var(--surface)]/95">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            Trending this week
          </h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Based on vouches, views, and reactions
          </p>
        </div>
        <div className="divide-y divide-[var(--border)]/50">
          {trending.length === 0 ? (
            <p className="px-4 py-8 text-sm text-[var(--muted)] text-center">
              No activity yet this week. Vouch someone, react to a profile, or browse around!
            </p>
          ) : (
            trending.map((entry, i) => (
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
                <span className="shrink-0 text-xs text-[var(--muted)]">
                  score {entry.score}
                </span>
              </Link>
            ))
          )}
        </div>
        <div className="border-t border-[var(--border)] px-4 py-2">
          <Link
            href="/"
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
