import Link from "next/link";
import { getLeaderboardTopVouches } from "@/lib/member-profiles";

export default async function LeaderboardWidget() {
  const entries = await getLeaderboardTopVouches(5);
  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "short" });

  return (
    <div className="w-full max-w-[220px]">
      <Link href="/dashboard/leaderboard" className="block">
        <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2 hover:text-[var(--accent)] transition-colors">
          Top vouches · {monthName}
        </h2>
      </Link>
      {entries.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">No vouches yet this month</p>
      ) : (
        <ol className="space-y-1.5">
          {entries.map((entry, i) => (
            <li key={entry.slug}>
              <Link
                href={`/${entry.slug}`}
                className="flex items-center gap-2 text-sm hover:text-[var(--accent)] transition-colors"
              >
                <span
                  className={`shrink-0 w-5 text-right font-mono text-xs ${
                    i === 0 ? "text-amber-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-amber-700" : "text-[var(--muted)]"
                  }`}
                >
                  {i + 1}.
                </span>
                <span className="flex-1 min-w-0 truncate text-[var(--foreground)]">
                  {entry.name || entry.slug}
                </span>
                <span className="shrink-0 text-xs text-[var(--muted)]">
                  {entry.count}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <Link
        href="/dashboard/leaderboard"
        className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline"
      >
        View leaderboard →
      </Link>
    </div>
  );
}
