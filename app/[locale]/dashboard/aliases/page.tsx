import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import {
  getOrCreateMemberProfile,
  getOrCreateUser,
  listProfileAliases,
  maxAliasesForPremium,
} from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { slugFromUsername } from "@/lib/slug";
import { getPremiumAccess } from "@/lib/premium-permissions";
import DashboardProfileAliases from "@/app/[locale]/dashboard/DashboardProfileAliases";

export const metadata: Metadata = {
  title: "Profile aliases",
  description: `Manage alternate profile URLs for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

export default async function ProfileAliasesPage() {
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

  const [premiumAccess, aliases] = await Promise.all([
    getPremiumAccess(session.sub),
    listProfileAliases(profile.id),
  ]);

  const maxAliases = maxAliasesForPremium(premiumAccess.hasAccess);

  return (
    <div className="space-y-6">
      <DashboardProfileAliases
        profile={profile}
        aliases={aliases}
        maxAliases={maxAliases}
        hasPremiumAccess={premiumAccess.hasAccess}
      />
    </div>
  );
}
