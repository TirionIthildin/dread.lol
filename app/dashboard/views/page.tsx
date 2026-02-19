import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile, getProfileViews } from "@/lib/member-profiles";
import { slugFromUsername } from "@/lib/slug";
import DashboardViewsClient from "./DashboardViewsClient";

export const metadata: Metadata = {
  title: "Logs",
  description: "View count and recent visitors to your profile",
  robots: "noindex, nofollow",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function DashboardViewsPage() {
  const session = await getSession();
  if (!session) redirect("/dashboard");
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) redirect("/dashboard");

  const slug = slugFromUsername(session.preferred_username ?? session.name ?? session.sub);
  const name = session.name ?? session.preferred_username ?? "Member";
  const profile = await getOrCreateMemberProfile(user.id, {
    name,
    slug,
    avatarUrl: session.picture ?? undefined,
  });

  const { viewCount, recentViews } = await getProfileViews(profile.id);
  const showViews = profile.showPageViews ?? true;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">Logs</h1>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-[var(--bg)]/80">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <span>Your page:</span>
            <Link
              href={`/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              /{profile.slug}
            </Link>
            <DashboardViewsClient slug={profile.slug} />
          </div>
          {showViews && (
            <p className="text-sm font-medium text-[var(--foreground)]">
              {viewCount} view{viewCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          {!showViews ? (
            <p className="p-4 text-sm text-[var(--muted)]">Page view tracking is disabled for your profile.</p>
          ) : recentViews.length === 0 ? (
            <p className="p-4 text-sm text-[var(--muted)]">No views yet.</p>
          ) : (
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {recentViews.map((v) => (
                  <tr key={v.id} className="border-b border-[var(--border)]/70 last:border-b-0">
                    <td className="px-4 py-2 font-medium text-[var(--foreground)]">{v.visitorIp}</td>
                    <td className="px-4 py-2 text-[var(--muted)]">{formatDate(v.viewedAt)}</td>
                    <td className="hidden max-w-[240px] truncate px-4 py-2 text-[var(--muted)] sm:table-cell">
                      {v.userAgent ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
