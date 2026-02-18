"use client";

type Props = { defaultValue: string };

export default function PendingSearchForm({ defaultValue }: Props) {
  return (
    <form method="GET" action="/dashboard/admin/pending" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search by username, display name, or ID…"
        className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        aria-label="Search pending users"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
      >
        Search
      </button>
      {defaultValue && (
        <a
          href="/dashboard/admin/pending"
          className="shrink-0 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
        >
          Clear
        </a>
      )}
    </form>
  );
}
