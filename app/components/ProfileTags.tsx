interface ProfileTagsProps {
  tags: string[];
}

export default function ProfileTags({ tags }: ProfileTagsProps) {
  if (!tags.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-1.5 text-xs text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]"
        >
          <span className="text-[var(--accent)]/80 mr-1.5 font-medium">#</span>
          {tag}
        </span>
      ))}
    </div>
  );
}
