import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getOrCreateUser,
  getProfileSlugByUserId,
  getMemberProfileBySlug,
} from "@/lib/member-profiles";
import { getTemplatesByCreator } from "@/lib/marketplace-templates";
import DashboardMarketplacePageClient from "@/app/[locale]/dashboard/marketplace/DashboardMarketplacePageClient";

export default async function DashboardMarketplacePage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }
  await getOrCreateUser(session);
  const templates = await getTemplatesByCreator(session.sub);
  let profileId: string | null = null;
  const slug = await getProfileSlugByUserId(session.sub);
  if (slug) {
    const profile = await getMemberProfileBySlug(slug);
    if (profile) profileId = profile.id;
  }
  return (
    <DashboardMarketplacePageClient initialTemplates={templates} profileId={profileId} />
  );
}
