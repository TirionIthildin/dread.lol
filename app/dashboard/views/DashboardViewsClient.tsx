"use client";

import { useState, useCallback } from "react";

export default function DashboardViewsClient({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : "";
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [slug]);
  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
    >
      {copied ? "Copied!" : "Copy URL"}
    </button>
  );
}
