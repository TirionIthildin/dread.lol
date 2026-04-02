import type { SessionUser } from "@/lib/auth/session";
import type { DashboardMyProfileProps } from "@/app/[locale]/dashboard/DashboardMyProfile";
import {
  getOrCreateUser,
  getOrCreateMemberProfile,
  getUserDiscordBadgeData,
  resolveProfileAvatar,
  memberProfileToProfile,
} from "@/lib/member-profiles";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { decodeDiscordPublicFlags, getPremiumBadgeKeys } from "@/lib/discord-badges";
import { getDiscordWidgetData } from "@/lib/discord-widgets";
import { getRobloxWidgetData, hasRobloxLinked } from "@/lib/roblox-widgets";
import { getCryptoWidgetData } from "@/lib/crypto-widgets";
import { getGithubWidgetData } from "@/lib/github-widgets";
import { getProfileVersions } from "@/lib/profile-versions";
import { slugFromUsername } from "@/lib/slug";

export type ProfileEditorPageProps = DashboardMyProfileProps;

export type LoadProfileEditorPageDataResult =
  | { ok: true; props: ProfileEditorPageProps }
  | { ok: false; dbError: true };

function isMongoUnavailableMessage(msg: string): boolean {
  return (
    msg.includes("MongoServerSelectionError") ||
    msg.includes("connection refused") ||
    msg.includes("connect ECONNREFUSED")
  );
}

/**
 * Loads profile, preview payloads, and versions for the dashboard profile editor page.
 */
export async function loadProfileEditorPageData(session: SessionUser): Promise<LoadProfileEditorPageDataResult> {
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
        getCryptoWidgetData({
          cryptoWalletEthereum: (profile as { cryptoWalletEthereum?: string | null }).cryptoWalletEthereum,
          cryptoWalletBitcoin: (profile as { cryptoWalletBitcoin?: string | null }).cryptoWalletBitcoin,
          cryptoWalletSolana: (profile as { cryptoWalletSolana?: string | null }).cryptoWalletSolana,
          cryptoWalletChain: (profile as { cryptoWalletChain?: string | null }).cryptoWalletChain,
          cryptoWalletAddress: (profile as { cryptoWalletAddress?: string | null }).cryptoWalletAddress,
        }).catch(() => null),
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
    if (cryptoWidgetData && cryptoWidgetData.length > 0) baseProfileForPreview.cryptoWidgets = { wallets: cryptoWidgetData };

    const props: ProfileEditorPageProps = {
      profile,
      baseProfileForPreview,
      versions,
      discordAvatarUrl: session.picture ?? undefined,
      availableDiscordBadges,
      widgetPreviewData,
      cryptoWidgetPreviewData: cryptoWidgetData,
      githubWidgetPreviewData,
      robloxLinked,
      hasPremiumAccess: premiumAccess.hasAccess,
    };

    return { ok: true, props };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isMongoUnavailableMessage(msg)) {
      return { ok: false, dbError: true };
    }
    throw err;
  }
}
