"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-6 max-w-md">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Something went wrong</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        An error occurred in the dashboard. You can try again or go back.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
