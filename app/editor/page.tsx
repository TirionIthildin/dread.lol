import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile, memberProfileToProfile } from "@/lib/member-profiles";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getDiscordWidgetData } from "@/lib/discord-widgets";
import { getRobloxWidgetData } from "@/lib/roblox-widgets";
import { slugFromUsername } from "@/lib/slug";
import { canUseDashboard } from "@/lib/dashboard-access";
import ProfilePageEditor from "@/app/editor/ProfilePageEditor";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Profile editor | ${SITE_NAME}`,
  description: `Full-page drag-and-drop profile editor for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

export default async function EditorPage() {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const canUseDashboardAccess = canUseDashboard(user);

  if (!session || !canUseDashboardAccess) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-6 py-8 text-center max-w-md">
          <p className="font-medium text-[var(--warning)]">Sign in required</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            <Link href="/api/auth/discord" className="text-[var(--accent)] hover:underline">
              Log in with Discord
            </Link>{" "}
            to use the profile editor.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  try {
    const { id: userId } = user!;
    const slug = slugFromUsername(session.preferred_username ?? session.name ?? session.sub);
    const name = session.name ?? session.preferred_username ?? "Member";
    const profile = await getOrCreateMemberProfile(userId, { name, slug, avatarUrl: session.picture ?? undefined });
    const [premiumAccess, robloxWidgetData] = await Promise.all([
      getPremiumAccess(userId),
      getRobloxWidgetData(userId, ["accountAge", "profile"]).catch(() => null),
    ]);
    const baseProfile = memberProfileToProfile(profile, undefined, undefined, undefined, premiumAccess.hasAccess);
    if (robloxWidgetData) baseProfile.robloxWidgets = robloxWidgetData;
    baseProfile.showDiscordWidgets = profile.showDiscordWidgets ?? undefined;
    baseProfile.showRobloxWidgets = profile.showRobloxWidgets ?? undefined;
    const widgetPreviewData = await getDiscordWidgetData(
      profile.userId,
      ["accountAge", "joined", "serverCount", "serverInvite"],
      profile.discordInviteUrl,
      profile.createdAt
    ).catch(() => null);
    if (widgetPreviewData) baseProfile.discordWidgets = widgetPreviewData;

    return (
      <ProfilePageEditor
        profileId={profile.id}
        baseProfile={baseProfile}
        profileRow={profile}
        hasPremiumAccess={premiumAccess.hasAccess}
        profileSlug={profile.slug}
      />
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isDbError = msg.includes("MongoServerSelectionError") || msg.includes("connection refused");
    if (isDbError) {
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-6 py-4 text-sm text-center">
            <p className="font-medium">Database not available</p>
            <p className="mt-1 text-[var(--muted)]">Start MongoDB and try again.</p>
          </div>
        </div>
      );
    }
    throw err;
  }
}
