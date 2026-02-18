import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import DashboardNavAdmin from "@/app/dashboard/DashboardNavAdmin";

function DashboardIcon() {
  return (
    <svg
      className="size-5 shrink-0 text-[var(--accent)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-4-4-3 3" />
    </svg>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const isAdmin = user?.isAdmin ?? false;

  return (
    <div className="min-h-screen flex flex-col grid-bg scanlines">
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

      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl font-mono shadow-[0_1px_0_var(--border)]">
        <div className="content-container flex h-14 md:h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--muted)] transition-all duration-200 hover:text-[var(--terminal)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
          >
            <span className="text-[var(--terminal)]">$</span> cd ..
            <span className="text-[var(--muted)]"> / {SITE_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            <DashboardNavAdmin isAdmin={isAdmin} />
            <span className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg)]/60 px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors duration-200">
              <DashboardIcon />
              Dashboard
            </span>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="flex-1 flex flex-col content-container py-6 md:py-8"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
