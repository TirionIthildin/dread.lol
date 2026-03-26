export default function ProfileLoading() {
  return (
    <div className="relative z-10 w-full max-w-2xl animate-fade-in" aria-hidden>
      <div className="h-9 w-28 rounded-lg bg-[var(--surface-hover)]/60 animate-skeleton mb-6" />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/90 px-3 py-2.5 sm:px-4">
          <div className="flex gap-1.5 items-center shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/60 animate-skeleton" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]/60 animate-skeleton" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/60 animate-skeleton" />
          </div>
          <span className="ml-2 h-3 w-24 rounded bg-[var(--surface-hover)] animate-skeleton" />
        </div>
        <div className="p-3 sm:p-4 border-t border-[var(--border)]/50 space-y-4">
          <div className="flex items-center gap-1 text-[var(--muted)]">
            <span className="text-[var(--terminal)]/70">$</span>
            <span className="h-4 w-28 rounded bg-[var(--surface-hover)]/60 animate-skeleton" />
          </div>
          <div className="h-20 rounded-lg bg-[var(--surface-hover)]/40 animate-skeleton animate-delay-100" />
          <div className="flex gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-[var(--surface-hover)]/60 ring-2 ring-[var(--border)] animate-skeleton animate-delay-200" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-5 w-28 rounded bg-[var(--surface-hover)]/50 animate-skeleton animate-delay-200" />
              <div className="h-4 w-full max-w-xs rounded bg-[var(--surface-hover)]/40 animate-skeleton animate-delay-300" />
            </div>
          </div>
          <div className="h-4 w-full rounded bg-[var(--surface-hover)]/30 animate-skeleton animate-delay-300" />
          <div className="h-4 w-2/3 rounded bg-[var(--surface-hover)]/30 animate-skeleton animate-delay-400" />
        </div>
      </div>
    </div>
  );
}
