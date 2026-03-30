"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pipette, ExternalLink, Star, Ban, Flag } from "lucide-react";
import { toast } from "sonner";

interface TemplateRow {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  applyCount: number;
  creatorId: string;
  featured?: boolean;
}

export default function StaffTemplatesPanel() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace/templates?admin=1")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((tData) => {
        setTemplates(tData.items ?? []);
      })
      .catch(() => {
        setTemplates([]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggleFeatured(id: string, currentlyFeatured: boolean) {
    const res = await fetch(`/api/marketplace/templates/${id}/feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !currentlyFeatured }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
      return;
    }
    toast.success(currentlyFeatured ? "Removed from featured" : "Featured");
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, featured: !currentlyFeatured } : t))
    );
  }

  async function adminUnpublish(id: string) {
    if (!confirm("Unpublish this template? The creator can republish it.")) return;
    const res = await fetch(`/api/marketplace/templates/${id}/admin-unpublish`, {
      method: "POST",
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
      return;
    }
    toast.success("Unpublished");
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "unpublished" } : t))
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 p-4 border-b border-[var(--border)] space-y-3">
        <Link
          href="/dashboard/staff/reports"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--warning)]/10"
        >
          <Flag size={16} className="text-[var(--warning)] shrink-0" aria-hidden />
          <span>
            Review profile &amp; template reports — <span className="text-[var(--accent)]">Staff → Reports</span>
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No templates yet.</p>
        ) : (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-[var(--foreground)]">{t.name}</span>
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    {t.status} · {t.applyCount} applied
                    {t.featured && " · Featured"}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(t.id, !!t.featured)}
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1.5 text-xs ${
                      t.featured
                        ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                    }`}
                    title={t.featured ? "Remove from featured" : "Feature"}
                  >
                    <Star size={14} strokeWidth={1.5} className={t.featured ? "fill-amber-400 text-amber-400" : ""} />
                  </button>
                  {t.status === "published" && (
                    <button
                      type="button"
                      onClick={() => adminUnpublish(t.id)}
                      className="inline-flex items-center gap-1 rounded border border-[var(--warning)]/30 px-2 py-1.5 text-xs text-[var(--warning)] hover:bg-[var(--warning)]/10"
                    >
                      <Ban size={14} />
                      Unpublish
                    </button>
                  )}
                  <Link
                    href={`/marketplace/${t.id}/preview`}
                    className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Pipette size={14} />
                    Preview
                  </Link>
                  <Link
                    href={`/marketplace/${t.id}`}
                    className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={14} />
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
