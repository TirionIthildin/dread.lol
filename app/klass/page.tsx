import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlaceholderLayout from "@/app/components/PlaceholderLayout";
import ProfileContent from "@/app/components/ProfileContent";
import { getProfileBySlug } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "Klass",
  description: "Profile #1",
};

export default function KlassPage() {
  const profile = getProfileBySlug("klass");
  if (!profile) notFound();
  return (
    <PlaceholderLayout>
      <ProfileContent profile={profile} />
    </PlaceholderLayout>
  );
}
