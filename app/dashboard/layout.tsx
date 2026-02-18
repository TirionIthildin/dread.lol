import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl font-mono">
        <div className="content-container flex h-14 md:h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--terminal)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
          >
            <span className="text-[var(--terminal)]">$</span> cd ..
            <span className="text-[var(--muted)]"> / {SITE_NAME}</span>
          </Link>
          <span className="text-xs text-[var(--muted)] font-medium">
            Dashboard
          </span>
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
