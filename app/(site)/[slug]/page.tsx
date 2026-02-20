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
  getProfileReactions,
  getCurrentUserReaction,
  getSimilarProfiles,
  getMutualGuilds,
} from "@/lib/member-profiles";
import { getDiscordPresence } from "@/lib/discord-presence";
import { getDiscordLastSeen } from "@/lib/discord-lastseen";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import ProfileAdminToolbar from "@/app/components/ProfileAdminToolbar";
import { getClientIp, getUserAgent } from "@/lib/request";
import { SITE_NAME, SITE_URL, SITE_OG_IMAGE } from "@/lib/site";
import type { Profile } from "@/lib/profiles";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const memberRow = await getMemberProfileBySlug(slug);
  const profile: Profile | null = memberRow ? memberProfileToProfile(memberRow) : null;
  if (!profile) return { title: "Not found" };
  const title = profile.name;
  const description =
    profile.metaDescription?.trim() ||
    profile.tagline ||
    profile.description ||
    `${profile.name} on ${SITE_NAME}`;
  const canonicalUrl = `${SITE_URL}/${slug}`;
  const ogImage = profile.ogImageUrl ?? profile.avatar ?? SITE_OG_IMAGE;
  const noindex = Boolean(profile.noindex);
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
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
  const [ip, userAgent, badgeFlags, customBadges, discordBadgeData, vouchesData, session, currentUser, discordPresence, discordLastSeen, viewCount] = await Promise.all([
    getClientIp(),
    getUserAgent(),
    getUserBadges(memberRow.userId),
    getCustomBadgesForUser(memberRow.userId),
    getUserDiscordBadgeData(memberRow.userId),
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
  const [reactions, userReaction, similarProfiles, mutualGuilds] = await Promise.all([
    getProfileReactions(memberRow.id),
    session ? getCurrentUserReaction(memberRow.id, session.sub) : Promise.resolve(null),
    getSimilarProfiles(memberRow.id, memberRow.tags ?? [], 6),
    session && session.sub !== memberRow.userId
      ? getMutualGuilds(session.sub, memberRow.userId)
      : Promise.resolve([]),
  ]);
  await recordProfileView(memberRow.id, ip, userAgent);
  const currentUserHasVouched = session
    ? await hasUserVouched(memberRow.id, session.sub)
    : false;
  const canVouch = session != null && session.sub !== memberRow.userId;
  const mutualVouchers = session && canVouch
    ? await getMutualVouchers(session.sub, memberRow.id, memberRow.userId)
    : [];
  const profile = memberProfileToProfile(memberRow, badgeFlags, discordBadgeData, customBadges);
  if (showPageViews) profile.viewCount = viewCount;
  const showDiscordPresence = memberRow.showDiscordPresence !== false;
  const showLastSeen = showDiscordPresence && (!discordPresence?.status || discordPresence?.status === "offline");
  if (showDiscordPresence && discordPresence) {
    profile.discordPresence = {
      status: discordPresence.status,
      activities: discordPresence.activities.map((a) => ({
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
  const canReact = session != null && session.sub !== memberRow.userId;
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
        reactions={{ slug, reactions, userReaction, canReact }}
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
