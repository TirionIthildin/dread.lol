"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CopyButton from "@/app/components/CopyButton";

const LANGUAGES = [
  { value: "", label: "Plain text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "markdown", label: "Markdown" },
  { value: "sql", label: "SQL" },
  { value: "yaml", label: "YAML" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
];

interface PasteCreateFormProps {
  isLoggedIn?: boolean;
}

export default function PasteCreateForm({ isLoggedIn = false }: PasteCreateFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [result, setResult] = useState<{ url: string; slug: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      window.location.href = "/api/auth/discord";
      return;
    }
    if (!content.trim()) {
      toast.error("Enter something to paste");
      return;
    }
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          language: language || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create paste");
      }
      setResult({ url: data.url, slug: data.slug });
      toast.success("Paste created");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create paste";
      if (msg.toLowerCase().includes("log in")) {
        window.location.href = "/api/auth/discord";
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--muted)] text-sm">
          <span className="text-[var(--terminal)]">→</span> Paste saved. Share this link:
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--accent)] text-sm break-all">
            {result.url}
          </code>
          <CopyButton
            copyValue={result.url}
            ariaLabel="Copy paste URL"
            className="shrink-0"
          >
            Copy
          </CopyButton>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/p/${result.slug}`)}
            className="px-4 py-2 rounded border border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 text-sm font-medium transition-colors"
          >
            View paste
          </button>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setContent("");
              setLanguage("");
            }}
            className="px-4 py-2 rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-bright)] text-sm transition-colors"
          >
            New paste
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLoggedIn && (
        <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
          <Link
            href="/api/auth/discord"
            className="inline-flex items-center gap-2 font-medium text-[var(--accent)] hover:underline"
          >
            Log in with Discord to create pastes
          </Link>
        </div>
      )}
      <div>
        <label htmlFor="paste-language" className="sr-only">
          Language
        </label>
        <select
          id="paste-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full max-w-[200px] mb-3 px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
        >
          {LANGUAGES.map((opt) => (
            <option key={opt.value || "plain"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="paste-content" className="sr-only">
          Content
        </label>
        <textarea
          id="paste-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your code or text here..."
          rows={14}
          className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] text-sm font-mono placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none resize-y min-h-[200px]"
          spellCheck={false}
          disabled={isSubmitting}
        />
      </div>
      <p className="text-xs text-[var(--muted)]">
        Max 1MB. Pastes are attributed to your account.
      </p>
      <button
        type="submit"
        disabled={isSubmitting || !isLoggedIn}
        className="px-4 py-2 rounded border border-[var(--terminal)] bg-[var(--terminal)]/10 text-[var(--terminal)] hover:bg-[var(--terminal)]/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isLoggedIn
          ? "Log in to create"
          : isSubmitting
            ? "Creating…"
            : "Create paste"}
      </button>
    </form>
  );
}
