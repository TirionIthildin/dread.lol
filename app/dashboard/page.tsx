import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import {
  getOrCreateUser,
  getOrCreateMemberProfile,
  getProfileViews,
} from "@/lib/member-profiles";
import DashboardAuth from "@/app/dashboard/DashboardAuth";
import DashboardMyProfile from "@/app/dashboard/DashboardMyProfile";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `Manage your profile for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

function slugFromUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "member";
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  const { error, message } = await searchParams;

  return (
    <div className="space-y-6">
      <DashboardAuth user={session} error={error} message={message} />

      {session && (
        <>
          <div>
            <h1 id="my-profile-heading" className="text-xl font-semibold text-[var(--foreground)]">
              My profile
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Edit your page and see who viewed it (IP and time).
            </p>
          </div>
          <MemberProfileSection session={session} />
        </>
      )}
    </div>
  );
}

async function MemberProfileSection({
  session,
}: {
  session: { sub: string; name?: string; preferred_username?: string; picture?: string | null };
}) {
  try {
    const { id: userId } = await getOrCreateUser(session);
    const slug = slugFromUsername(session.preferred_username ?? session.name ?? session.sub);
    const name = session.name ?? session.preferred_username ?? "Member";
    const profile = await getOrCreateMemberProfile(userId, {
      name,
      slug,
      avatarUrl: session.picture ?? undefined,
    });
    const { viewCount, recentViews } = await getProfileViews(profile.id);
    return (
      <DashboardMyProfile
        profile={profile}
        viewCount={viewCount}
        recentViews={recentViews}
      />
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isMissingTable =
      msg.includes('relation "profiles" does not exist') ||
      msg.includes('relation "users" does not exist');
    if (isMissingTable) {
      return (
        <div
          className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]"
          role="alert"
        >
          <p className="font-medium">Database not set up</p>
          <p className="mt-1 text-[var(--muted)]">
            Run migrations so the <code className="rounded bg-[var(--surface)] px-1">profiles</code> and{" "}
            <code className="rounded bg-[var(--surface)] px-1">users</code> tables exist. From the project root:
          </p>
          <p className="mt-2 font-mono text-xs">
            npm run db:migrate
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Or apply <code className="rounded bg-[var(--surface)] px-1">drizzle/0000_initial.sql</code> and{" "}
            <code className="rounded bg-[var(--surface)] px-1">drizzle/0001_member_profiles.sql</code> manually with psql.
          </p>
        </div>
      );
    }
    throw err;
  }
}
