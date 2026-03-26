import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import SiteNoticeBanner from "@/app/components/SiteNoticeBanner";
import { getOrCreateUser } from "@/lib/member-profiles";
import { isVerifiedCreator } from "@/lib/creator-program";
import DashboardSidebar from "@/app/[locale]/dashboard/DashboardSidebar";
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row grid-bg scanlines">
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[var(--bg)] focus:font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:[clip:auto] focus:[margin:0]"
      >
        Skip to content
      </a>
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

      <aside className="sticky top-0 z-40 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl font-mono md:w-56 lg:w-64 md:max-h-screen">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <DashboardSidebar isAdmin={isAdmin} verifiedCreator={verifiedCreator} session={session} />
        </div>
      </aside>

      <main
        id="main-content"
        className="flex-1 min-w-0 flex flex-col content-container py-4 md:py-6 md:!max-w-[96rem]"
        tabIndex={-1}
      >
        {dashboardNotice.show ? (
          <div className="mb-4 shrink-0">
            <SiteNoticeBanner message={dashboardNotice.message} variant={dashboardNotice.variant} />
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
