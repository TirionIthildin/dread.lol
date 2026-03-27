import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canUseDashboard } from "@/lib/dashboard-access";
import { getOrCreateUser } from "@/lib/member-profiles";
import DashboardSecuritySessions from "@/app/[locale]/dashboard/DashboardSecuritySessions";
import DashboardTotpSection from "@/app/[locale]/dashboard/DashboardTotpSection";
import { DashboardPageHeader } from "@/app/[locale]/dashboard/components/DashboardPageHeader";
import {
  dashboardPanelClassName,
  dashboardPanelPaddingClassName,
} from "@/app/[locale]/dashboard/components/dashboardPanel";

export default async function SecurityPage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Security"
        description="Two-factor authentication and sign-in sessions for your account."
      />

      <section className={`${dashboardPanelClassName} ${dashboardPanelPaddingClassName}`}>
        <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Two-factor authentication</h2>
        <DashboardTotpSection />
      </section>

      <section className={`${dashboardPanelClassName} ${dashboardPanelPaddingClassName}`}>
        <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Sessions</h2>
        <DashboardSecuritySessions />
      </section>
    </div>
  );
}
