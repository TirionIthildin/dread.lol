"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Logo from "@/app/components/Logo";
import { SITE_NAME } from "@/lib/site";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export default function Navigation() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl font-mono">
      <div className="content-container flex h-14 md:h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] focus:rounded-[var(--radius)]"
          onClick={() => setMobileNavOpen(false)}
          aria-label={`${SITE_NAME} – Home`}
        >
          <span className="text-[var(--terminal)]">$</span>
          <span className="text-[var(--muted)] hidden sm:inline">user@dread</span>
          <span className="text-[var(--muted)] hidden sm:inline">:</span>
          <span className="text-[var(--accent)] hidden sm:inline">~</span>
          <Logo size={24} className="md:w-7 md:h-7 sm:ml-1" />
          <span className="text-sm font-medium text-[var(--foreground)] sm:text-base">dread.lol</span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] md:text-sm ${
                  isActive
                    ? "text-[var(--terminal)] bg-[var(--surface-hover)]"
                    : "text-[var(--muted)] hover:text-[var(--terminal)] hover:bg-[var(--surface-hover)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-[var(--muted)]/70">/</span>
                {label.toLowerCase()}
              </Link>
            );
          })}
          <span className="ml-1 text-[var(--muted)]/50 text-xs">_</span>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded border border-[var(--border)] text-[var(--terminal)] hover:bg-[var(--surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          >
            {mobileNavOpen ? (
              <span className="text-sm">×</span>
            ) : (
              <span className="text-sm">≡</span>
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`md:hidden border-t border-[var(--border)] bg-[var(--surface)] font-mono ${mobileNavOpen ? "block" : "hidden"}`}
        aria-hidden={!mobileNavOpen}
      >
        <nav className="content-container flex flex-col py-3" aria-label="Main">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)] ${
                  isActive
                    ? "text-[var(--terminal)] bg-[var(--surface-hover)]"
                    : "text-[var(--muted)] hover:text-[var(--terminal)]"
                }`}
                onClick={() => setMobileNavOpen(false)}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-[var(--terminal)]">$</span> open {label.toLowerCase()}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
