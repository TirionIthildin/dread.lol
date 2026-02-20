"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eyedropper, ArrowSquareOut, Star, Prohibit, Flag } from "@phosphor-icons/react";
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

interface ReportRow {
  templateId: string;
  templateName: string;
  reason: string | null;
  reportedBy: string;
  reportCount: number;
}

export default function AdminTemplatesPanel() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "reports">("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/marketplace/templates?admin=1").then((res) => (res.ok ? res.json() : { items: [] })),
      fetch("/api/dashboard/admin/template-reports").then((res) => (res.ok ? res.json() : { items: [] })),
    ])
      .then(([tData, rData]) => {
        setTemplates(tData.items ?? []);
        setReports(rData.items ?? []);
      })
      .catch(() => {
        setTemplates([]);
        setReports([]);
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
      <div className="shrink-0 flex gap-1 p-4 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            activeTab === "all"
              ? "bg-[var(--accent)]/15 text-[var(--accent)]"
              : "text-[var(--muted)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          All templates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 ${
            activeTab === "reports"
              ? "bg-[var(--warning)]/15 text-[var(--warning)]"
              : "text-[var(--muted)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Flag size={16} />
          Reported ({reports.length})
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : activeTab === "reports" ? (
          reports.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No reported templates.</p>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li
                  key={r.templateId}
                  className="flex items-center justify-between gap-4 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-[var(--foreground)]">{r.templateName}</span>
                    <span className="ml-2 text-xs text-[var(--muted)]">
                      {r.reportCount} report{r.reportCount !== 1 ? "s" : ""}
                    </span>
                    {r.reason && (
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{r.reason}</p>
                    )}
                  </div>
                  <Link
                    href={`/marketplace/${r.templateId}`}
                    className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs hover:bg-[var(--surface-hover)]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowSquareOut size={14} />
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )
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
                    <Star size={14} weight={t.featured ? "fill" : "regular"} />
                  </button>
                  {t.status === "published" && (
                    <button
                      type="button"
                      onClick={() => adminUnpublish(t.id)}
                      className="inline-flex items-center gap-1 rounded border border-[var(--warning)]/30 px-2 py-1.5 text-xs text-[var(--warning)] hover:bg-[var(--warning)]/10"
                    >
                      <Prohibit size={14} />
                      Unpublish
                    </button>
                  )}
                  <Link
                    href={`/marketplace/${t.id}/preview`}
                    className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eyedropper size={14} />
                    Preview
                  </Link>
                  <Link
                    href={`/marketplace/${t.id}`}
                    className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowSquareOut size={14} />
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
