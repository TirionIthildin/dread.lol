import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileContent from "@/app/components/ProfileContent";
import {
  getProfileBySlug,
  getProfileSlugs,
} from "@/lib/profiles";
import { SITE_NAME } from "@/lib/site";

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
  return {
    title,
    description,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);
  if (!profile) notFound();
  return <ProfileContent profile={profile} />;
}
