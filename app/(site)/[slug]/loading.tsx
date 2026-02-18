export default function ProfileLoading() {
  return (
    <div className="relative z-10 w-full max-w-2xl animate-pulse" aria-hidden>
      <div className="h-5 w-24 rounded bg-[var(--surface-hover)] mb-6" />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 overflow-hidden shadow-xl shadow-black/30">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/90 px-3 py-2.5 sm:px-4">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
          </div>
          <span className="ml-2 h-3 w-20 rounded-md bg-[var(--surface-hover)]" />
        </div>
        <div className="p-3 sm:p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-[var(--surface-hover)]" />
          <div className="h-24 rounded-lg bg-[var(--surface-hover)]/60" />
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--surface-hover)] ring-2 ring-[var(--border)]" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-24 rounded bg-[var(--surface-hover)]" />
              <div className="h-4 w-64 rounded bg-[var(--surface-hover)]/80" />
            </div>
          </div>
          <div className="h-4 w-full rounded bg-[var(--surface-hover)]/40" />
          <div className="h-4 w-2/3 rounded bg-[var(--surface-hover)]/40" />
        </div>
      </div>
    </div>
  );
}
