import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile, getShortLinksForProfile } from "@/lib/member-profiles";
import { slugFromUsername } from "@/lib/slug";
import DashboardMyProfile from "@/app/dashboard/DashboardMyProfile";
import UnapprovedMessage from "@/app/components/UnapprovedMessage";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `Manage your profile for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

export default async function DashboardPage() {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const canUseDashboard = user && (user.approved || user.isAdmin);

  return (
    <div className="space-y-6">
      {session && !canUseDashboard && (
        <div className="animate-fade-in-up animate-delay-100">
          <UnapprovedMessage />
        </div>
      )}

      {session && canUseDashboard && (
        <div className="animate-fade-in-up animate-delay-100">
          <MemberProfileSection session={session} />
        </div>
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
    const shortLinks = await getShortLinksForProfile(profile.id);
    return (
      <DashboardMyProfile
        profile={profile}
        shortLinks={shortLinks}
        discordAvatarUrl={session.picture ?? undefined}
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
