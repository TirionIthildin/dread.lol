interface ProfileStatusProps {
  status: string;
}

export default function ProfileStatus({ status }: ProfileStatusProps) {
  return (
    <p className="mt-3 flex items-center gap-2.5 rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/50 py-2 px-3 text-xs text-[var(--muted)] w-fit">
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-[var(--terminal)] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)] ring-2 ring-[var(--terminal)]/20"
        aria-hidden
      />
      <span className="font-medium">{status}</span>
    </p>
  );
}
