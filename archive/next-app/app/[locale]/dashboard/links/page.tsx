import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { slugFromUsername } from "@/lib/slug";
import { getPremiumAccess } from "@/lib/premium-permissions";
import DashboardLinks from "@/app/[locale]/dashboard/DashboardLinks";

export const metadata: Metadata = {
  title: "Links",
  description: `Manage your profile links for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

export default async function LinksPage() {
  const session = await getSession();
  if (!session) redirect("/dashboard");

  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) redirect("/dashboard");

  const slug = slugFromUsername(
    session.preferred_username ?? session.name ?? session.sub
  );
  const name = session.name ?? session.preferred_username ?? "Member";
  const [profile, premiumAccess] = await Promise.all([
    getOrCreateMemberProfile(user.id, {
      name,
      slug,
      avatarUrl: session.picture ?? undefined,
    }),
    getPremiumAccess(session.sub),
  ]);

  return (
    <div className="space-y-6">
      <DashboardLinks profile={profile} hasPremiumAccess={premiumAccess.hasAccess} />
    </div>
  );
}
