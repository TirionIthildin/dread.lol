"use client";

import CopyButton from "@/app/components/CopyButton";
import ProfileMarkdown from "@/app/components/ProfileMarkdown";

interface PasteViewProps {
  content: string;
  language: string | null;
  slug: string;
  /** Base URL for raw link (e.g. https://dread.lol). Used for Copy raw. */
  baseUrl?: string;
}

export default function PasteView({ content, language, slug, baseUrl = "" }: PasteViewProps) {
  const rawUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/api/paste/${slug}?raw=1` : `/api/paste/${slug}?raw=1`;
  const isMarkdown = (language ?? "").toLowerCase() === "markdown";

  return (
    <div className="animate-fade-in animate-delay-100">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <CopyButton copyValue={content} ariaLabel="Copy paste content">
          Copy
        </CopyButton>
        <a
          href={`/api/paste/${slug}?raw=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          Raw
        </a>
        <CopyButton copyValue={rawUrl} ariaLabel="Copy raw URL">
          Copy raw
        </CopyButton>
      </div>
      {isMarkdown ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--foreground)]">
          <ProfileMarkdown content={content} className="paste-markdown" />
        </div>
      ) : (
        <pre
          className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm font-mono text-[var(--foreground)]"
          data-language={language || undefined}
        >
          <code>{content}</code>
        </pre>
      )}
    </div>
  );
}
