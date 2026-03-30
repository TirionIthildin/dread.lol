"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import CopyButton from "@/app/components/CopyButton";

interface PasteItem {
  slug: string;
  url: string;
  preview: string;
  language: string | null;
  createdAt: string;
}

interface PasteHistoryProps {
  isLoggedIn: boolean;
  onEdit: (slug: string, content: string, language: string) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

export default function PasteHistory({
  isLoggedIn,
  onEdit,
  onRefresh,
  refreshTrigger = 0,
}: PasteHistoryProps) {
  const [pastes, setPastes] = useState<PasteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const fetchPastes = useCallback(async () => {
    if (!isLoggedIn) {
      setPastes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/paste");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load pastes");
      setPastes(data.pastes ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load pastes");
      setPastes([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchPastes();
  }, [fetchPastes, refreshTrigger]);

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this paste? This cannot be undone.")) return;
    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/paste/${slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setPastes((prev) => prev.filter((p) => p.slug !== slug));
      toast.success("Paste deleted");
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete paste");
    } finally {
      setDeletingSlug(null);
    }
  };

  const handleEdit = async (slug: string) => {
    try {
      const res = await fetch(`/api/paste/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load paste");
      onEdit(slug, data.content ?? "", data.language ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load paste");
    }
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <p className="text-sm text-[var(--muted)]">
        <span className="text-[var(--terminal)]">$</span> Loading pastes…
      </p>
    );
  }

  if (pastes.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        <span className="text-[var(--terminal)]">$</span> No pastes yet. Create one above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">
        <span className="text-[var(--terminal)]">$</span> Pastes
      </p>
      <ul className="space-y-2">
        {pastes.map((p) => {
          const rawUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/api/paste/${p.slug}?raw=1`
              : `/api/paste/${p.slug}?raw=1`;
          return (
            <li
              key={p.slug}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <code className="block truncate text-[var(--accent)] text-xs">
                    /p/{p.slug}
                  </code>
                  <p className="mt-1 truncate text-[var(--muted)]">
                    {p.preview || <em>Empty</em>}
                    {p.preview.length >= 80 ? "…" : ""}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {p.language || "plain"} ·{" "}
                    {new Date(p.createdAt).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <Link
                    href={`/p/${p.slug}`}
                    className="inline-flex items-center min-h-[36px] rounded border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    View
                  </Link>
                  <a
                    href={`/api/paste/${p.slug}?raw=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center min-h-[36px] rounded border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    Raw
                  </a>
                  <CopyButton
                    copyValue={rawUrl}
                    ariaLabel="Copy raw URL"
                    className="!min-h-[36px] !px-2.5 !py-1.5 !text-xs"
                  >
                    Copy raw
                  </CopyButton>
                  <button
                    type="button"
                    onClick={() => handleEdit(p.slug)}
                    className="inline-flex items-center min-h-[36px] rounded border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.slug)}
                    disabled={deletingSlug === p.slug}
                    className="inline-flex items-center min-h-[36px] rounded border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:border-[#ef4444] hover:text-[#ef4444] transition-colors disabled:opacity-50"
                  >
                    {deletingSlug === p.slug ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
