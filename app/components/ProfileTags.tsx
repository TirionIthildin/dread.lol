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
          className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
