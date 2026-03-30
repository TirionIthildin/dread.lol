import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { listFavoritePublishedTemplatesForUser } from "@/lib/template-favorites";
import DashboardMarketplaceFavoritesClient from "@/app/[locale]/dashboard/marketplace/favorites/DashboardMarketplaceFavoritesClient";

export default async function DashboardMarketplaceFavoritesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }
  await getOrCreateUser(session);
  const items = await listFavoritePublishedTemplatesForUser(session.sub);
  return <DashboardMarketplaceFavoritesClient initialItems={items} />;
}
