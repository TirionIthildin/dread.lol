import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import DashboardSidebar from "@/app/dashboard/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const isAdmin = user?.isAdmin ?? false;

  return (
    <div className="min-h-screen flex flex-col md:flex-row grid-bg scanlines">
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[var(--bg)] focus:font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:[clip:auto] focus:[margin:0]"
      >
        Skip to content
      </a>
      <div
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
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

      <aside className="sticky top-0 z-40 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl font-mono md:w-56 lg:w-60 md:max-h-screen">
        <div className="flex h-14 md:h-auto shrink-0 items-center px-4 md:px-3 md:pt-4 md:pb-1 border-b md:border-b-0 border-[var(--border)]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-all duration-200 hover:text-[var(--terminal)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
          >
            <span className="text-[var(--terminal)]">$</span> cd ..
            <span className="text-[var(--muted)]"> / {SITE_NAME}</span>
          </Link>
        </div>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <DashboardSidebar isAdmin={isAdmin} session={session} />
        </div>
      </aside>

      <main
        id="main-content"
        className="flex-1 min-w-0 flex flex-col content-container py-6 md:py-8"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
