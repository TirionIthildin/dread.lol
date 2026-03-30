/**
 * Build profile + vouches for staff preview (no view recording, no session).
 */
import {
  getMemberProfileByUserId,
  getUserBadges,
  getCustomBadgesForUser,
  getUserDiscordBadgeData,
  getVouchesForProfile,
  getSimilarProfiles,
  getProfileViewCount,
  memberProfileToProfile,
  resolveProfileAvatar,
} from "@/lib/member-profiles";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getProfileRestrictionStatus } from "@/lib/profile-restriction";
import { getDiscordWidgetData, type DiscordWidgetType } from "@/lib/discord-widgets";
import { getRobloxWidgetData, type RobloxWidgetType } from "@/lib/roblox-widgets";
import { getCryptoWidgetData } from "@/lib/crypto-widgets";
import { getGithubWidgetData, parseEnabledGithubWidgets } from "@/lib/github-widgets";
import { getDiscordPresence } from "@/lib/discord-presence";
import { getDiscordLastSeen } from "@/lib/discord-lastseen";
import type { Profile } from "@/lib/profiles";
import type { ProfileVouchesData } from "@/app/components/ProfileContent";

export type StaffProfilePreviewResult =
  | {
      ok: true;
      profile: Profile;
      vouches: ProfileVouchesData;
      similarProfiles: { slug: string; name: string }[];
      mutualGuilds: string[];
    }
  | { ok: false; code: "not_found" | "restricted"; message: string };

export async function getStaffProfilePreviewForUser(userId: string): Promise<StaffProfilePreviewResult> {
  const memberRow = await getMemberProfileByUserId(userId.trim());
  if (!memberRow) {
    return { ok: false, code: "not_found", message: "No profile for this user." };
  }

  const restrictionStatus = await getProfileRestrictionStatus(memberRow.userId);
  if (restrictionStatus.restricted) {
    return { ok: false, code: "restricted", message: "This profile is restricted." };
  }

  const showPageViews = memberRow.showPageViews ?? true;
  const slug = memberRow.slug;

  const [
    badgeFlags,
    customBadges,
    discordBadgeData,
    premiumAccess,
    vouchesData,
    discordPresence,
    discordLastSeen,
    viewCount,
  ] = await Promise.all([
    getUserBadges(memberRow.userId),
    getCustomBadgesForUser(memberRow.userId),
    getUserDiscordBadgeData(memberRow.userId),
    getPremiumAccess(memberRow.userId),
    getVouchesForProfile(memberRow.id),
    getDiscordPresence(memberRow.userId),
    getDiscordLastSeen(memberRow.userId),
    showPageViews ? getProfileViewCount(memberRow.id) : Promise.resolve(0),
  ]);

  const [similarProfiles, discordWidgetData, robloxWidgetData, cryptoWidgetData, githubWidgetData] =
    await Promise.all([
      getSimilarProfiles(memberRow.id, memberRow.tags ?? [], 6),
      (() => {
        const raw = memberRow.showDiscordWidgets?.trim();
        if (!raw) return Promise.resolve(null);
        const map: Record<string, DiscordWidgetType> = {
          accountage: "accountAge",
          joined: "joined",
          servercount: "serverCount",
          serverinvite: "serverInvite",
        };
        const enabled = raw
          .split(",")
          .map((s) => map[s.trim().toLowerCase()])
          .filter(Boolean) as DiscordWidgetType[];
        if (enabled.length === 0) return Promise.resolve(null);
        return getDiscordWidgetData(memberRow.userId, enabled, memberRow.discordInviteUrl, memberRow.createdAt);
      })(),
      (() => {
        const raw = (memberRow as { showRobloxWidgets?: string | null }).showRobloxWidgets?.trim();
        if (!raw) return Promise.resolve(null);
        const map: Record<string, RobloxWidgetType> = {
          accountage: "accountAge",
          profile: "profile",
        };
        const enabled = raw
          .split(",")
          .map((s) => map[s.trim().toLowerCase()])
          .filter(Boolean) as RobloxWidgetType[];
        if (enabled.length === 0) return Promise.resolve(null);
        return getRobloxWidgetData(memberRow.userId, enabled);
      })(),
      (() => {
        const r = memberRow as {
          cryptoWalletEthereum?: string | null;
          cryptoWalletBitcoin?: string | null;
          cryptoWalletSolana?: string | null;
          cryptoWalletChain?: string | null;
          cryptoWalletAddress?: string | null;
        };
        return getCryptoWidgetData(r).catch(() => null);
      })(),
      (() => {
        const ghUser = (memberRow as { githubUsername?: string | null }).githubUsername?.trim();
        const raw = (memberRow as { showGithubWidgets?: string | null }).showGithubWidgets?.trim();
        if (!ghUser || !raw || parseEnabledGithubWidgets(raw).length === 0) return Promise.resolve(null);
        return getGithubWidgetData(ghUser, raw).catch(() => null);
      })(),
    ]);

  const resolvedRow = await resolveProfileAvatar(memberRow);
  const profile = memberProfileToProfile(
    resolvedRow,
    badgeFlags,
    discordBadgeData,
    customBadges,
    premiumAccess.hasAccess
  );
  if (showPageViews) profile.viewCount = viewCount;
  if (discordWidgetData) profile.discordWidgets = discordWidgetData;
  if (robloxWidgetData) profile.robloxWidgets = robloxWidgetData;
  if (cryptoWidgetData && cryptoWidgetData.length > 0) {
    profile.cryptoWidgets = { wallets: cryptoWidgetData };
  }
  if (githubWidgetData) profile.githubWidgets = githubWidgetData;
  profile.showDiscordWidgets = memberRow.showDiscordWidgets ?? undefined;
  profile.showRobloxWidgets = (memberRow as { showRobloxWidgets?: string | null }).showRobloxWidgets ?? undefined;

  const showDiscordPresence = memberRow.showDiscordPresence !== false;
  const showLastSeen = showDiscordPresence && (!discordPresence?.status || discordPresence?.status === "offline");
  if (showDiscordPresence && discordPresence) {
    profile.discordPresence = {
      status: discordPresence.status,
      activities: (discordPresence.activities ?? []).map((a) => ({
        name: a.name,
        type: a.type,
        state: a.state ?? undefined,
        details: a.details ?? undefined,
      })),
    };
  }
  if (showLastSeen && discordLastSeen) {
    profile.discordLastSeen = discordLastSeen.toISOString();
  }

  const vouches: ProfileVouchesData = {
    slug,
    count: vouchesData.count,
    vouchedBy: vouchesData.vouchedBy,
    currentUserHasVouched: false,
    canVouch: false,
  };

  return { ok: true, profile, vouches, similarProfiles, mutualGuilds: [] };
}
