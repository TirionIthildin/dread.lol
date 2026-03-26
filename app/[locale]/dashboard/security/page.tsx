import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canUseDashboard } from "@/lib/dashboard-access";
import { getOrCreateUser } from "@/lib/member-profiles";
import DashboardSecuritySessions from "@/app/[locale]/dashboard/DashboardSecuritySessions";
import DashboardTotpSection from "@/app/[locale]/dashboard/DashboardTotpSection";

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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Security</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Two-factor authentication and sign-in sessions for your account.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/40 p-4 md:p-6">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">Two-factor authentication</h2>
        <DashboardTotpSection />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/40 p-4 md:p-6">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">Sessions</h2>
        <DashboardSecuritySessions />
      </section>
    </div>
  );
}
