interface ProfileStatusProps {
  status: string;
}

export default function ProfileStatus({ status }: ProfileStatusProps) {
  return (
    <p className="mt-2 flex items-center gap-2 rounded-md bg-[var(--bg)]/40 py-1.5 px-2.5 text-xs text-[var(--muted)] w-fit">
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-[var(--terminal)] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"
        aria-hidden
      />
      <span className="font-medium">{status}</span>
    </p>
  );
}
