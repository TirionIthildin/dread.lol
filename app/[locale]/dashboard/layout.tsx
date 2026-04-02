import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import SiteNoticeBanner from "@/app/components/SiteNoticeBanner";
import { getOrCreateUser } from "@/lib/member-profiles";
import { isVerifiedCreator } from "@/lib/creator-program";
import DashboardSidebar from "@/app/[locale]/dashboard/DashboardSidebar";
import { DashboardShell } from "@/app/[locale]/dashboard/components/DashboardShell";
import { getSiteNoticeSettings } from "@/lib/site-notice-settings";
import { getSiteNoticeDisplay } from "@/lib/site-notice-settings-shared";

/** Default for all /dashboard routes — authenticated member UI should not be indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const isAdmin = user?.isAdmin ?? false;
  const verifiedCreator = session ? await isVerifiedCreator(session.sub) : false;
  const noticeSettings = await getSiteNoticeSettings();
  const dashboardNotice = getSiteNoticeDisplay("dashboard", noticeSettings);

  const dashboardNoticeEl = dashboardNotice.show ? (
    <SiteNoticeBanner message={dashboardNotice.message} variant={dashboardNotice.variant} />
  ) : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row grid-bg scanlines">
      <div
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none page-theme-minimalist-hide-ornament"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, var(--accent) 0%, transparent 50%)",
          }}
        />
      </div>

      <DashboardShell
        dashboardNotice={dashboardNoticeEl}
        sidebar={<DashboardSidebar isAdmin={isAdmin} verifiedCreator={verifiedCreator} session={session} />}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
