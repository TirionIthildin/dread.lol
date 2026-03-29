export default function DashboardLoading() {
  return (
    <div className="w-full animate-fade-in space-y-6" aria-hidden>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <span className="block h-7 max-w-xs rounded-lg bg-[var(--surface-hover)]/70 animate-skeleton" />
          <span className="block h-4 max-w-md rounded bg-[var(--surface-hover)]/50 animate-skeleton" />
        </div>
        <span className="h-10 w-28 shrink-0 rounded-lg bg-[var(--surface-hover)]/50 animate-skeleton" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <span className="h-28 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/40 animate-skeleton" />
        <span className="h-28 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/40 animate-skeleton" />
        <span className="h-28 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/40 animate-skeleton sm:col-span-2 lg:col-span-1" />
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-4 shadow-sm">
        <div className="mb-4 flex gap-2 border-b border-[var(--border)]/60 pb-3">
          <span className="h-8 w-24 rounded-md bg-[var(--surface-hover)]/60 animate-skeleton" />
          <span className="h-8 w-24 rounded-md bg-[var(--surface-hover)]/40 animate-skeleton" />
        </div>
        <div className="space-y-3">
          <span className="block h-4 w-full max-w-lg rounded bg-[var(--surface-hover)]/50 animate-skeleton" />
          <span className="block h-4 w-full max-w-md rounded bg-[var(--surface-hover)]/40 animate-skeleton" />
          <span className="block h-32 w-full rounded-xl bg-[var(--surface-hover)]/30 animate-skeleton" />
        </div>
      </div>
    </div>
  );
}
