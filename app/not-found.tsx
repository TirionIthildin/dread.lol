import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Not found",
  description: "The page you're looking for doesn't exist.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 grid-bg scanlines">
      <div className="relative z-10 w-full max-w-2xl space-y-4">
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
          </p>
          <pre className="mt-2 text-[10px] sm:text-xs leading-tight text-[var(--accent)] whitespace-pre font-mono" style={{ textShadow: "0 0 12px rgba(6, 182, 212, 0.2)" }} aria-hidden>
{` _  _    ___  ___  
| \\| |  / _ \\| __| 
| .\` | | (_) | _|  
|_|\\_|  \\___/|___| 
`}
          </pre>
          <p className="mt-4 text-[var(--muted)]">
            File not found. The page you’re looking for doesn’t exist or was moved.
          </p>
          <p className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/70 px-4 py-2.5 text-sm text-[var(--accent)] transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[0_0_14px_rgba(6,182,212,0.15)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
            >
              <span className="text-[var(--muted)]">$</span> cd .. — back to {SITE_NAME}
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
