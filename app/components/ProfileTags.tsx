interface ProfileTagsProps {
  tags: string[];
}

export default function ProfileTags({ tags }: ProfileTagsProps) {
  if (!tags.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--bg)]/90 px-2.5 py-1 text-xs text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)]/60 hover:text-[var(--accent)] hover:shadow-[0_0_12px_rgba(6,182,212,0.12)]"
        >
          <span className="text-[var(--accent)]/70 mr-1.5">#</span>
          {tag}
        </span>
      ))}
    </div>
  );
}
