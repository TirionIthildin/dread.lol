"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 max-w-md text-center">
        <h1 className="text-lg font-semibold text-[var(--foreground)]">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          An error occurred. You can try again or return home.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
