import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile, getGalleryForProfile } from "@/lib/member-profiles";
import { getBillingSettings } from "@/lib/settings";
import { canUseDashboard } from "@/lib/dashboard-access";
import { getPremiumAccess } from "@/lib/premium-permissions";
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
  const [user, billing, premiumAccess] = await Promise.all([
    getOrCreateUser(session),
    getBillingSettings(),
    getPremiumAccess(session.sub),
  ]);
  if (!canUseDashboard(user)) redirect("/dashboard");
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
        galleryMaxFree={billing.galleryMaxFree}
        hasPremiumAccess={premiumAccess.hasAccess}
      />
    </div>
  );
}
