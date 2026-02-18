import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlaceholderLayout from "@/app/components/PlaceholderLayout";
import ProfileContent from "@/app/components/ProfileContent";
import { getProfileBySlug } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "Balatro",
  description: "Profile #2",
};

export default function BalatroPage() {
  const profile = getProfileBySlug("balatro");
  if (!profile) notFound();
  return (
    <PlaceholderLayout>
      <ProfileContent profile={profile} />
    </PlaceholderLayout>
  );
}
