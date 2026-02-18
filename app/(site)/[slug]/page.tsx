import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileContent from "@/app/components/ProfileContent";
import {
  getProfileBySlug,
  getProfileSlugs,
} from "@/lib/profiles";
import { SITE_NAME, SITE_URL, SITE_OG_IMAGE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getProfileSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);
  if (!profile) return { title: "Not found" };
  const title = profile.name;
  const description =
    profile.tagline ?? profile.description ?? `${profile.name} on ${SITE_NAME}`;
  const canonicalUrl = `${SITE_URL}/${slug}`;
  const ogImage = profile.avatar ?? SITE_OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
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

function ProfileJsonLd({ profile }: { profile: NonNullable<ReturnType<typeof getProfileBySlug>> }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    description: profile.tagline ?? profile.description ?? undefined,
    url: `${SITE_URL}/${profile.slug}`,
    ...(profile.avatar && { image: profile.avatar }),
    ...(profile.discord && { identifier: profile.discord }),
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
  const profile = getProfileBySlug(slug);
  if (!profile) notFound();
  return (
    <>
      <ProfileJsonLd profile={profile} />
      <ProfileContent profile={profile} />
    </>
  );
}
