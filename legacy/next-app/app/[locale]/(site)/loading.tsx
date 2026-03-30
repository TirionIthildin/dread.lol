export default function HomeLoading() {
  return (
    <div className="relative z-10 w-full max-w-2xl animate-fade-in" aria-hidden>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/90 px-3 py-2.5 sm:px-4">
          <div className="flex gap-1.5 items-center shrink-0">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]/60 animate-skeleton" />
            <span className="h-2 w-2 rounded-full bg-[#eab308]/60 animate-skeleton" />
            <span className="h-2 w-2 rounded-full bg-[#22c55e]/60 animate-skeleton" />
          </div>
          <span className="ml-2 h-3 w-44 rounded bg-[var(--surface-hover)] animate-skeleton" />
        </div>
        <div className="p-3 sm:p-4 border-t border-[var(--border)]/50">
          <div className="flex items-center gap-1 text-[var(--muted)]">
            <span className="text-[var(--terminal)]/70">$</span>
            <span className="h-4 w-32 rounded bg-[var(--surface-hover)]/60 animate-skeleton" />
          </div>
          <div className="mt-3 h-24 rounded bg-[var(--surface-hover)]/40 animate-skeleton" />
          <div className="mt-4 flex gap-2">
            <span className="h-4 w-16 rounded bg-[var(--surface-hover)]/50 animate-skeleton animate-delay-100" />
            <span className="h-4 flex-1 max-w-[60%] rounded bg-[var(--surface-hover)]/40 animate-skeleton animate-delay-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
