import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile, getShortLinksForProfile } from "@/lib/member-profiles";
import { getBillingSettings } from "@/lib/settings";
import { canUseDashboard } from "@/lib/dashboard-access";
import { slugFromUsername } from "@/lib/slug";
import DashboardLinks from "@/app/dashboard/DashboardLinks";

export const metadata: Metadata = {
  title: "Links",
  description: `Manage your profile links for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

export default async function LinksPage() {
  const session = await getSession();
  if (!session) redirect("/dashboard");

  const [user, billing] = await Promise.all([
    getOrCreateUser(session),
    getBillingSettings(),
  ]);
  if (!canUseDashboard(user)) redirect("/dashboard");

  const slug = slugFromUsername(
    session.preferred_username ?? session.name ?? session.sub
  );
  const name = session.name ?? session.preferred_username ?? "Member";
  const profile = await getOrCreateMemberProfile(user.id, {
    name,
    slug,
    avatarUrl: session.picture ?? undefined,
  });
  const shortLinks = await getShortLinksForProfile(profile.id);

  return (
    <div className="space-y-6">
      <DashboardLinks profile={profile} shortLinks={shortLinks} />
    </div>
  );
}
