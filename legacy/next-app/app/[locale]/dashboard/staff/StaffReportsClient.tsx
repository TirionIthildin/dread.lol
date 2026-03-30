"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Flag } from "lucide-react";
import { toast } from "sonner";

interface ProfileReportRow {
  profileId: string;
  slug: string;
  reason: string | null;
  reportedBy: string;
  reportCount: number;
  lastReportAt: string | null;
}

interface TemplateReportRow {
  templateId: string;
  templateName: string;
  reason: string | null;
  reportedBy: string;
  reportCount: number;
}

export default function StaffReportsClient() {
  const [tab, setTab] = useState<"profiles" | "templates">("profiles");
  const [profiles, setProfiles] = useState<ProfileReportRow[]>([]);
  const [templates, setTemplates] = useState<TemplateReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard/staff/profile-reports").then((res) => (res.ok ? res.json() : { items: [] })),
      fetch("/api/dashboard/staff/template-reports").then((res) => (res.ok ? res.json() : { items: [] })),
    ])
      .then(([p, t]) => {
        setProfiles(p.items ?? []);
        setTemplates(t.items ?? []);
      })
      .catch(() => {
        setProfiles([]);
        setTemplates([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function clearProfileReports(profileId: string) {
    if (!confirm("Remove all reports for this profile from the queue?")) return;
    const res = await fetch(
      `/api/dashboard/staff/profile-reports?profileId=${encodeURIComponent(profileId)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success(`Cleared ${data.deleted ?? 0} report(s)`);
    load();
  }

  async function clearTemplateReports(templateId: string) {
    if (!confirm("Remove all reports for this template from the queue?")) return;
    const res = await fetch(
      `/api/dashboard/staff/template-reports?templateId=${encodeURIComponent(templateId)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success(`Cleared ${data.deleted ?? 0} report(s)`);
    load();
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex flex-wrap gap-1 p-4 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setTab("profiles")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "profiles"
              ? "bg-[var(--accent)]/15 text-[var(--accent)]"
              : "text-[var(--muted)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Profiles ({profiles.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("templates")}
          className={`rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 ${
            tab === "templates"
              ? "bg-[var(--warning)]/15 text-[var(--warning)]"
              : "text-[var(--muted)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Flag size={16} aria-hidden />
          Marketplace templates ({templates.length})
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : tab === "profiles" ? (
          profiles.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No profile reports in the queue.</p>
          ) : (
            <ul className="space-y-2">
              {profiles.map((r) => (
                <li
                  key={r.profileId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-[var(--foreground)]">/{r.slug}</span>
                    <span className="ml-2 text-xs text-[var(--muted)]">
                      {r.reportCount} report{r.reportCount !== 1 ? "s" : ""}
                      {r.lastReportAt && (
                        <span className="ml-1">· last {new Date(r.lastReportAt).toLocaleString()}</span>
                      )}
                    </span>
                    {r.reason && (
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{r.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/${r.slug}`}
                      className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs hover:bg-[var(--surface-hover)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={14} />
                      View profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => clearProfileReports(r.profileId)}
                      className="rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                    >
                      Clear queue
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : templates.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No template reports in the queue.</p>
        ) : (
          <ul className="space-y-2">
            {templates.map((r) => (
              <li
                key={r.templateId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-3 py-2.5"
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
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/marketplace/${r.templateId}`}
                    className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs hover:bg-[var(--surface-hover)]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={14} />
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => clearTemplateReports(r.templateId)}
                    className="rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  >
                    Clear queue
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
