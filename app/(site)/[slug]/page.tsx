import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileContent from "@/app/components/ProfileContent";
import ProfileCursorEffect from "@/app/components/ProfileCursorEffect";
import ProfileBackground from "@/app/components/ProfileBackground";
import {
  getMemberProfileBySlug,
  recordProfileView,
  memberProfileToProfile,
  getProfileViewCount,
  getUserBadges,
  getCustomBadgesForUser,
  getUserDiscordBadgeData,
  getVouchesForProfile,
  hasUserVouched,
  getMutualVouchers,
  getSimilarProfiles,
  getMutualGuilds,
} from "@/lib/member-profiles";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getProfileRestrictionStatus } from "@/lib/profile-restriction";
import RestrictedProfileMessage from "@/app/components/RestrictedProfileMessage";
import { getDiscordWidgetData, type DiscordWidgetType } from "@/lib/discord-widgets";
import { getRobloxWidgetData, type RobloxWidgetType } from "@/lib/roblox-widgets";
import { getDiscordPresence } from "@/lib/discord-presence";
import { getDiscordLastSeen } from "@/lib/discord-lastseen";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import ProfileAdminToolbar from "@/app/components/ProfileAdminToolbar";
import { getClientIp, getUserAgent, getReferer, getCfCountry } from "@/lib/request";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Profile } from "@/lib/profiles";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const memberRow = await getMemberProfileBySlug(slug);
  if (!memberRow) return { title: "Not found" };
  const restrictionStatus = await getProfileRestrictionStatus(memberRow.userId);
  if (restrictionStatus.restricted) {
    return {
      title: "Profile restricted",
      description: "This profile has been restricted due to either a billing issue or being terminated.",
      robots: { index: false, follow: false },
    };
  }
  const profile = memberProfileToProfile(memberRow);
  const title = profile.name;
  const description =
    profile.metaDescription?.trim() ||
    profile.tagline ||
    profile.description ||
    `${profile.name} on ${SITE_NAME}`;
  const canonicalUrl = `${SITE_URL}/${slug}`;
  const noindex = Boolean(profile.noindex);
  // OG image from /api/og/[slug] (themed embed or redirect to custom ogImageUrl)
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    ...(noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: `/api/og/${slug}`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/${slug}`],
    },
  };
}

function ProfileJsonLd({ profile }: { profile: Profile }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    description: profile.tagline ?? profile.description ?? undefined,
    url: `${SITE_URL}/${profile.slug}`,
    ...(profile.avatar && { image: profile.avatar }),
    ...(profile.discord && { identifier: profile.discord }),
    ...(profile.location?.trim() && { address: { "@type": "Place", name: profile.location.trim() } }),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const memberRow = await getMemberProfileBySlug(slug);
  if (!memberRow) notFound();
  const showPageViews = memberRow.showPageViews ?? true;
  const [ip, userAgent, referrer, countryCode, badgeFlags, customBadges, discordBadgeData, premiumAccess, restrictionStatus, vouchesData, session, currentUser, discordPresence, discordLastSeen, viewCount] = await Promise.all([
    getClientIp(),
    getUserAgent(),
    getReferer(),
    getCfCountry(),
    getUserBadges(memberRow.userId),
    getCustomBadgesForUser(memberRow.userId),
    getUserDiscordBadgeData(memberRow.userId),
    getPremiumAccess(memberRow.userId),
    getProfileRestrictionStatus(memberRow.userId),
    getVouchesForProfile(memberRow.id),
    getSession(),
    (async () => {
      const s = await getSession();
      return s ? getOrCreateUser(s) : null;
    })(),
    getDiscordPresence(memberRow.userId),
    getDiscordLastSeen(memberRow.userId),
    showPageViews ? getProfileViewCount(memberRow.id) : Promise.resolve(0),
  ]);
  const [similarProfiles, mutualGuilds, discordWidgetData, robloxWidgetData] = await Promise.all([
    getSimilarProfiles(memberRow.id, memberRow.tags ?? [], 6),
    session && session.sub !== memberRow.userId
      ? getMutualGuilds(session.sub, memberRow.userId)
      : Promise.resolve([]),
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
  ]);
  await recordProfileView(memberRow.id, ip, userAgent, {
    referrer: referrer ?? undefined,
    viewerUserId: session && session.sub !== memberRow.userId ? session.sub : undefined,
    countryCode: countryCode ?? undefined,
  });
  const currentUserHasVouched = session
    ? await hasUserVouched(memberRow.id, session.sub)
    : false;
  const canVouch = session != null && session.sub !== memberRow.userId;
  const mutualVouchers = session && canVouch
    ? await getMutualVouchers(session.sub, memberRow.id, memberRow.userId)
    : [];
  const profile = memberProfileToProfile(memberRow, badgeFlags, discordBadgeData, customBadges, premiumAccess.hasAccess);
  if (showPageViews) profile.viewCount = viewCount;
  if (discordWidgetData) profile.discordWidgets = discordWidgetData;
  if (robloxWidgetData) profile.robloxWidgets = robloxWidgetData;
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
  const vouches = {
    slug,
    count: vouchesData.count,
    vouchedBy: vouchesData.vouchedBy,
    mutualVouchers,
    currentUserHasVouched,
    canVouch,
  };
  if (restrictionStatus.restricted) {
    return (
      <div className="min-h-screen grid-bg">
        <div className="content-container py-12">
          <RestrictedProfileMessage />
        </div>
      </div>
    );
  }

  const needsCursorEffect = profile.cursorStyle === "glow" || profile.cursorStyle === "trail";
  const isAdmin = (currentUser as { isAdmin?: boolean } | null)?.isAdmin ?? false;
  const showAdminToolbar = isAdmin && session?.sub !== memberRow.userId;
  const content = (
    <>
      <ProfileJsonLd profile={profile} />
      {showAdminToolbar && (
        <ProfileAdminToolbar isAdmin={isAdmin} profileOwnerUserId={memberRow.userId} />
      )}
      <ProfileContent
        profile={profile}
        vouches={vouches}
        similarProfiles={similarProfiles}
        mutualGuilds={mutualGuilds}
        canReport={session?.sub !== memberRow.userId}
        canSubmitReport={session != null && session.sub !== memberRow.userId}
      />
    </>
  );

  return (
    <ProfileBackground profile={profile}>
      {needsCursorEffect ? (
        <ProfileCursorEffect cursorStyle={profile.cursorStyle} accentColor={profile.accentColor}>
          {content}
        </ProfileCursorEffect>
      ) : (
        content
      )}
    </ProfileBackground>
  );
}
