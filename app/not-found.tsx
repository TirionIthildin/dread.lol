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
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 sm:px-4">
          <span className="h-2 w-2 rounded-full bg-[#ef4444]" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-[#eab308]" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-[#22c55e]" aria-hidden />
          <span className="ml-2 font-mono text-xs text-[var(--muted)]">404.txt</span>
        </div>
        <div className="p-4 font-mono text-sm sm:p-5 sm:text-sm border-t border-[var(--border)]/50">
          <p className="text-[var(--terminal)]">
            <span className="text-[var(--muted)]">$</span> cat 404.txt
          </p>
          <pre className="mt-2 text-[10px] sm:text-xs leading-tight text-[var(--accent)] whitespace-pre font-mono" aria-hidden>
{` _  _    ___  ___  
| \\| |  / _ \\| __| 
| .\` | | (_) | _|  
|_|\\_|  \\___/|___| 
`}
          </pre>
          <p className="mt-4 text-[var(--muted)]">
            File not found. The page you’re looking for doesn’t exist or was moved.
          </p>
          <p className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[var(--accent)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] rounded"
            >
              <span className="text-[var(--muted)]">$</span> cd ..
            </Link>
            <span className="ml-2 text-[var(--muted)]">— back to {SITE_NAME}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
