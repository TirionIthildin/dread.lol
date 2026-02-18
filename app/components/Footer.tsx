import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { PROFILES } from "@/lib/profiles";

const FOOTER_LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "cd /" },
  ...PROFILES.map((p) => ({ href: `/${p.slug}`, label: `open ${p.slug}` })),
];

interface FooterProps {
  pathname?: string;
}

export default function Footer({ pathname = "/" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] mt-auto font-mono" aria-label="Site footer">
      <div className="content-container flex flex-col items-center justify-between gap-4 py-6 sm:flex-row sm:py-8">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="text-[var(--terminal)]">$</span>
            <span>dread@web:~</span>
            <span className="text-[var(--accent)]">status</span>
            <span className="text-[var(--foreground)]">READY</span>
          </div>
          <p className="text-xs text-[var(--muted)]">© {currentYear} {SITE_NAME}</p>
        </div>
        <nav className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs" aria-label="Footer">
          <Link
            href="#main-content"
            className="text-[var(--muted)] hover:text-[var(--terminal)] transition-colors focus:outline-none focus:underline focus:decoration-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            aria-label="Back to top"
          >
            <span className="text-[var(--terminal)]">$</span> cd ..
          </Link>
          {FOOTER_LINKS.map(({ href, label }) => {
            const isActive =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`transition-colors focus:outline-none focus:underline focus:decoration-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] ${
                  isActive ? "text-[var(--terminal)]" : "text-[var(--muted)] hover:text-[var(--terminal)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
