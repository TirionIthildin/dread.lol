import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
  description: "The page you're looking for doesn't exist.",
  robots: { index: false, follow: true },
};

const QUICK_LINKS = [
  { href: "/", prompt: "cd ~" },
  { href: "/marketplace", prompt: "open marketplace" },
  { href: "/trending", prompt: "open trending" },
  { href: "/dashboard", prompt: "open dashboard" },
] as const;

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 grid-bg scanlines">
      <div className="relative z-10 w-full max-w-2xl space-y-4 animate-fade-in-up">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] rounded-lg px-2 py-1 -mt-2"
        >
          <span className="text-[var(--terminal)]">$</span> cd .. — dread.lol
        </Link>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/90 px-3 py-2.5 sm:px-4">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-[#eab308]" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" aria-hidden />
            <span className="ml-2 font-mono text-xs text-[var(--muted)]">404.txt</span>
          </div>
          <div className="p-4 font-mono text-sm sm:p-5 sm:text-sm border-t border-[var(--border)]/50">
            <p className="text-[var(--terminal)]">
              <span className="text-[var(--muted)]">$</span> cat 404.txt
              <span className="cursor-blink ml-0.5 text-[var(--accent)]" aria-hidden>_</span>
            </p>
            <p className="mt-4 text-[var(--muted)]">
              {`File not found. The page you're looking for doesn't exist or was moved.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {QUICK_LINKS.map(({ href, prompt }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs sm:text-sm text-[var(--accent)] transition-all duration-200 hover:border-[var(--accent)] hover:shadow-accent-soft focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
                >
                  <span className="text-[var(--muted)]">$</span> {prompt}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
