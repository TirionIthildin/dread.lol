"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CopyButton from "@/app/components/CopyButton";
import SearchableSelect from "@/app/components/SearchableSelect";

const LANGUAGES = [
  { value: "markdown", label: "Markdown" },
  { value: "", label: "Plain text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
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
  /** When false, show Premium required message. */
  canCreatePaste?: boolean;
  /** When set, form is in edit mode. Pass slug, content, language. */
  editing?: { slug: string; content: string; language: string } | null;
  onEditCancel?: () => void;
  onEditSuccess?: () => void;
  onCreated?: () => void;
}

export default function PasteCreateForm({
  isLoggedIn = false,
  canCreatePaste = false,
  editing = null,
  onEditCancel,
  onEditSuccess,
  onCreated,
}: PasteCreateFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(editing?.content ?? "");
  const [language, setLanguage] = useState(editing?.language || "markdown");
  const [result, setResult] = useState<{ url: string; slug: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setContent(editing.content);
      setLanguage(editing.language || "markdown");
      setResult(null);
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      window.location.href = "/api/auth/discord";
      return;
    }
    if (!canCreatePaste) {
      toast.error("Paste requires Premium. Upgrade at the Shop.");
      return;
    }
    if (!content.trim()) {
      toast.error("Enter something to paste");
      return;
    }
    setIsSubmitting(true);
    setResult(null);
    try {
      if (editing) {
        const res = await fetch(`/api/paste/${editing.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            language: language || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update paste");
        toast.success("Paste updated");
        onEditSuccess?.();
        setContent("");
        setLanguage("markdown");
      } else {
        const res = await fetch("/api/paste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            language: language || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create paste");
        setResult({ url: data.url, slug: data.slug });
        toast.success("Paste created");
        onCreated?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save paste";
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
    const rawUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/paste/${result.slug}?raw=1`;
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
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/paste/${result.slug}?raw=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-sm transition-colors"
          >
            Raw
          </a>
          <CopyButton copyValue={rawUrl} ariaLabel="Copy raw URL" className="shrink-0">
            Copy raw
          </CopyButton>
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
              setLanguage("markdown");
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
      {isLoggedIn && !canCreatePaste && (
        <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
          Paste requires Premium.{" "}
          <Link
            href="/dashboard/shop"
            className="inline-flex items-center gap-2 font-medium text-[var(--accent)] hover:underline"
          >
            Upgrade at the Shop
          </Link>{" "}
          to create pastes.
        </div>
      )}
      <div className="mb-3 max-w-[200px]">
        <SearchableSelect
          value={language}
          onChange={setLanguage}
          options={LANGUAGES.map((opt) => ({
            value: opt.value || "",
            label: opt.label,
          }))}
          placeholder="Select language…"
          searchPlaceholder="Search language…"
          ariaLabel="Paste language"
        />
      </div>
      <div>
        <label htmlFor="paste-content" className="sr-only">
          Content
        </label>
        <textarea
          id="paste-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={language === "markdown" ? "Write markdown… **bold**, *italic*, [links](url), `code`" : "Paste your code or text here..."}
          rows={14}
          className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] text-sm font-mono placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none resize-y min-h-[200px]"
          spellCheck={false}
          disabled={isSubmitting}
        />
      </div>
      <p className="text-xs text-[var(--muted)]">
        Max 1MB. Pastes are attributed to your account.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !isLoggedIn || !canCreatePaste}
          className="px-4 py-2 rounded border border-[var(--terminal)] bg-[var(--terminal)]/10 text-[var(--terminal)] hover:bg-[var(--terminal)]/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isLoggedIn
            ? "Log in to create"
            : !canCreatePaste
              ? "Premium required"
              : isSubmitting
                ? editing
                  ? "Updating…"
                  : "Creating…"
                : editing
                  ? "Update paste"
                  : "Create paste"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onEditCancel}
            className="px-4 py-2 rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-bright)] text-sm transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
