export default function HomeLoading() {
  return (
    <div className="relative z-10 w-full max-w-2xl animate-pulse">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 sm:px-4">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
          </div>
          <span className="ml-2 h-3 w-40 rounded bg-[var(--surface-hover)]" />
        </div>
        <div className="p-6 sm:p-8">
          <div className="h-4 w-48 rounded bg-[var(--surface-hover)] mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-[var(--surface-hover)]/60" />
            <div className="h-4 w-[85%] rounded bg-[var(--surface-hover)]/60" />
            <div className="h-4 w-3/5 rounded bg-[var(--surface-hover)]/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
