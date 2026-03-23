"use client";

import { usePathname } from "next/navigation";

interface PlaceholderLayoutProps {
  children: React.ReactNode;
}

/**
 * Placeholder-style layout: no top nav, centered main (top-aligned for long /docs pages).
 */
export default function PlaceholderLayout({ children }: PlaceholderLayoutProps) {
  const pathname = usePathname();
  const docsLayout = pathname?.startsWith("/docs") ?? false;

  return (
    <div className="min-h-screen flex flex-col grid-bg scanlines">
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded focus:bg-[var(--foreground)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] focus:[clip:auto] focus:[margin:0] focus:[position:fixed]"
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

      <main
        id="main-content"
        className={`flex-1 flex flex-col items-center p-3 min-h-0 overflow-auto ${
          docsLayout ? "justify-start" : "justify-center"
        }`}
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
