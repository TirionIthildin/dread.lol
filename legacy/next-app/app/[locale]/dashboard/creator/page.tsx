import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { isVerifiedCreator } from "@/lib/creator-program";
import CreatorSpaceClient from "@/app/[locale]/dashboard/CreatorSpaceClient";
import { DashboardPageHeader } from "@/app/[locale]/dashboard/components/DashboardPageHeader";

export const metadata: Metadata = {
  title: "Creator",
};

export default async function CreatorPage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) {
    redirect("/dashboard");
  }
  if (!(await isVerifiedCreator(session.sub))) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Creator"
        description="Your program badge and share link."
      />
      <CreatorSpaceClient />
    </div>
  );
}
