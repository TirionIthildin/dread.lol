import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile, getShortLinksForProfile } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { slugFromUsername } from "@/lib/slug";
import DashboardShortLinks from "@/app/dashboard/DashboardShortLinks";

export const metadata: Metadata = {
  title: "Short links",
  description: `Manage your short links for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

export default async function ShortLinksPage() {
  const session = await getSession();
  if (!session) redirect("/dashboard");

  const user = await getOrCreateUser(session);
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
      <DashboardShortLinks profile={profile} shortLinks={shortLinks} />
    </div>
  );
}
