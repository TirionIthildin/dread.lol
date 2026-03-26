import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { getTemplateById } from "@/lib/marketplace-templates";
import DashboardMarketplaceEditClient from "@/app/[locale]/dashboard/marketplace/[id]/DashboardMarketplaceEditClient";

export default async function DashboardMarketplaceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }
  const user = await getOrCreateUser(session);
  const template = await getTemplateById(id);
  if (!template) {
    notFound();
  }
  const canView =
    template.status === "published" || template.creatorId === session.sub || user.isAdmin;
  if (!canView) {
    notFound();
  }
  if (template.creatorId !== session.sub && !user.isAdmin) {
    redirect("/dashboard/marketplace");
  }
  return <DashboardMarketplaceEditClient templateId={id} initialTemplate={template} />;
}
