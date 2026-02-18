import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileContent from "@/app/components/ProfileContent";
import { getProfileBySlug, getProfileSlugs } from "@/lib/profiles";
import {
  getMemberProfileBySlug,
  recordProfileView,
  memberProfileToProfile,
  getUserBadges,
} from "@/lib/member-profiles";
import { getClientIp, getUserAgent } from "@/lib/request";
import { SITE_NAME, SITE_URL, SITE_OG_IMAGE } from "@/lib/site";
import type { Profile } from "@/lib/profiles";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getProfileSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const staticProfile = getProfileBySlug(slug);
  let profile: Profile | null = staticProfile ?? null;
  if (!profile) {
    const memberRow = await getMemberProfileBySlug(slug);
    profile = memberRow ? memberProfileToProfile(memberRow) : null;
  }
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
  const staticProfile = getProfileBySlug(slug);
  if (staticProfile) {
    return (
      <>
        <ProfileJsonLd profile={staticProfile} />
        <ProfileContent profile={staticProfile} />
      </>
    );
  }
  const memberRow = await getMemberProfileBySlug(slug);
  if (!memberRow) notFound();
  const [ip, userAgent, badges] = await Promise.all([
    getClientIp(),
    getUserAgent(),
    getUserBadges(memberRow.userId),
  ]);
  await recordProfileView(memberRow.id, ip, userAgent);
  const profile = memberProfileToProfile(memberRow, badges);
  return (
    <>
      <ProfileJsonLd profile={profile} />
      <ProfileContent profile={profile} />
    </>
  );
}
