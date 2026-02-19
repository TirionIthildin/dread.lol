import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile, getGalleryForProfile } from "@/lib/member-profiles";
import { slugFromUsername } from "@/lib/slug";
import DashboardGallery from "@/app/dashboard/DashboardGallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Manage your profile gallery",
  robots: "noindex, nofollow",
};

export default async function GalleryPage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) {
    redirect("/dashboard");
  }
  const slug = slugFromUsername(session.preferred_username ?? session.name ?? session.sub);
  const name = session.name ?? session.preferred_username ?? "Member";
  const profile = await getOrCreateMemberProfile(user.id, {
    name,
    slug,
    avatarUrl: session.picture ?? undefined,
  });
  const gallery = await getGalleryForProfile(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Gallery</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Add and manage images shown on your profile.
        </p>
      </div>
      <DashboardGallery
        profileId={profile.id}
        profileSlug={profile.slug}
        initialGallery={gallery}
      />
    </div>
  );
}
