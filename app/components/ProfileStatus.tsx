interface ProfileStatusProps {
  status: string;
}

export default function ProfileStatus({ status }: ProfileStatusProps) {
  return (
    <p className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-[var(--terminal)] animate-pulse"
        aria-hidden
      />
      <span>{status}</span>
    </p>
  );
}
