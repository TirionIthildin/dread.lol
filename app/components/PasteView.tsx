"use client";

import CopyButton from "@/app/components/CopyButton";

interface PasteViewProps {
  content: string;
  language: string | null;
  slug: string;
}

export default function PasteView({ content, language, slug }: PasteViewProps) {
  const rawUrl = `/api/paste/${slug}?raw=1`;

  return (
    <div className="animate-fade-in animate-delay-100">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <CopyButton copyValue={content} ariaLabel="Copy paste content">
          Copy
        </CopyButton>
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          Raw
        </a>
      </div>
      <pre
        className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm font-mono text-[var(--foreground)]"
        data-language={language || undefined}
      >
        <code>{content}</code>
      </pre>
    </div>
  );
}
