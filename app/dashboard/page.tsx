import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { PolarSuccessHandler } from "@/app/dashboard/PolarSuccessHandler";
import { getOrCreateUser, getOrCreateMemberProfile, getUserDiscordBadgeData, resolveProfileAvatar, memberProfileToProfile } from "@/lib/member-profiles";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { decodeDiscordPublicFlags, getPremiumBadgeKeys } from "@/lib/discord-badges";
import { getDiscordWidgetData } from "@/lib/discord-widgets";
import { getRobloxWidgetData, hasRobloxLinked } from "@/lib/roblox-widgets";
import { getCryptoWidgetData } from "@/lib/crypto-widgets";
import { getGithubWidgetData } from "@/lib/github-widgets";
import { getProfileVersions } from "@/lib/profile-versions";
import { slugFromUsername } from "@/lib/slug";
import DashboardMyProfile from "@/app/dashboard/DashboardMyProfile";
import { LocalPasskeyEnroll } from "@/app/dashboard/LocalPasskeyEnroll";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `Manage your profile for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

import { canUseDashboard as checkDashboardAccess } from "@/lib/dashboard-access";

export default async function DashboardPage() {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const canUseDashboard = checkDashboardAccess(user);

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <PolarSuccessHandler />
      </Suspense>
      {session && canUseDashboard && (
        <div className="animate-fade-in-up animate-delay-100 space-y-4">
          {session.auth_provider === "local" ? <LocalPasskeyEnroll /> : null}
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
    const [discordBadgeData, premiumAccess, widgetPreviewData, versions, robloxLinked, robloxWidgetData, cryptoWidgetData, githubWidgetPreviewData] =
      await Promise.all([
        getUserDiscordBadgeData(userId),
        getPremiumAccess(userId),
        getDiscordWidgetData(
          profile.userId,
          ["accountAge", "joined", "serverCount", "serverInvite"],
          profile.discordInviteUrl,
          profile.createdAt
        ).catch(() => null),
        getProfileVersions(userId),
        hasRobloxLinked(userId),
        getRobloxWidgetData(userId, ["accountAge", "profile"]).catch(() => null),
        getCryptoWidgetData(
          (profile as { cryptoWalletChain?: string | null }).cryptoWalletChain,
          (profile as { cryptoWalletAddress?: string | null }).cryptoWalletAddress
        ).catch(() => null),
        getGithubWidgetData(
          (profile as { githubUsername?: string | null }).githubUsername,
          (profile as { showGithubWidgets?: string | null }).showGithubWidgets
        ).catch(() => null),
      ]);
    const availableDiscordBadges = [
      ...decodeDiscordPublicFlags(discordBadgeData.flags ?? 0),
      ...getPremiumBadgeKeys(discordBadgeData.premiumType),
    ];
    const resolvedProfile = await resolveProfileAvatar(profile);
    const baseProfileForPreview = memberProfileToProfile(resolvedProfile, undefined, discordBadgeData, undefined, premiumAccess.hasAccess);
    if (robloxWidgetData) baseProfileForPreview.robloxWidgets = robloxWidgetData;
    if (cryptoWidgetData) baseProfileForPreview.cryptoWidgets = cryptoWidgetData;
    return (
      <Suspense
        fallback={
          <div className="min-h-[50vh] rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 flex items-center justify-center text-sm text-[var(--muted)]">
            Loading profile editor…
          </div>
        }
      >
        <DashboardMyProfile
          profile={profile}
          baseProfileForPreview={baseProfileForPreview}
          versions={versions}
          discordAvatarUrl={session.picture ?? undefined}
          availableDiscordBadges={availableDiscordBadges}
          widgetPreviewData={widgetPreviewData}
          cryptoWidgetPreviewData={cryptoWidgetData}
          githubWidgetPreviewData={githubWidgetPreviewData}
          robloxLinked={robloxLinked}
          hasPremiumAccess={premiumAccess.hasAccess}
        />
      </Suspense>
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isDbError = msg.includes("MongoServerSelectionError") || msg.includes("connection refused") || msg.includes("connect ECONNREFUSED");
    if (isDbError) {
      return (
        <div
          className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]"
          role="alert"
        >
          <p className="font-medium">Database not available</p>
          <p className="mt-1 text-[var(--muted)]">
            Start MongoDB (e.g. <code className="rounded bg-[var(--surface)] px-1">docker compose up -d</code>) and run:
          </p>
          <p className="mt-2 font-mono text-xs">
            npm run db:migrate-prod
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Ensure DATABASE_URL points to MongoDB (e.g. mongodb://dread:dread@localhost:27017/dread?authSource=admin).
          </p>
        </div>
      );
    }
    throw err;
  }
}
