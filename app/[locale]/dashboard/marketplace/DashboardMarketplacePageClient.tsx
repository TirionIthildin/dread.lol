"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Rocket, Ban, Trash, Pencil, Store } from "lucide-react";
import { toast } from "sonner";
import type { TemplateRow } from "@/lib/marketplace-templates";

const iconProps = { size: 18, className: "shrink-0" };

export default function DashboardMarketplacePageClient({
  initialTemplates,
  profileId,
}: {
  initialTemplates: TemplateRow[];
  profileId: string | null;
}) {
  const [templates, setTemplates] = useState<TemplateRow[]>(initialTemplates);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function createFromProfile() {
    setCreating(true);
    try {
      if (!profileId) {
        toast.error("Create a profile first in My Profile");
        return;
      }
      const res = await fetch("/api/marketplace/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromProfileId: profileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Template created");
      router.push(`/dashboard/marketplace/${data.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create template");
    } finally {
      setCreating(false);
    }
  }

  async function publish(id: string) {
    const res = await fetch(`/api/marketplace/templates/${id}/publish`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
      return;
    }
    toast.success("Template published");
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "published" } : t))
    );
    router.refresh();
  }

  async function unpublish(id: string) {
    const res = await fetch(`/api/marketplace/templates/${id}/unpublish`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
      return;
    }
    toast.success("Template unpublished");
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "unpublished" } : t))
    );
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    const res = await fetch(`/api/marketplace/templates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
      return;
    }
    toast.success("Template deleted");
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">My templates</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            <Store {...iconProps} />
            Browse marketplace
          </Link>
          <button
            type="button"
            onClick={createFromProfile}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
          >
            <Plus {...iconProps} />
            {creating ? "Creating…" : "Create from my profile"}
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] border-dashed p-8 text-center">
          <p className="text-sm text-[var(--muted)] mb-4">
            Create a template from your current profile and share it with the community.
          </p>
          <button
            type="button"
            onClick={createFromProfile}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20"
          >
            <Plus {...iconProps} />
            Create from my profile
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[var(--bg)]/30"
              >
                <Link
                  href={`/dashboard/marketplace/${t.id}`}
                  className="flex-1 min-w-0"
                >
                  <span className="font-medium text-[var(--foreground)]">{t.name}</span>
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    {t.status} · {t.applyCount} applied
                  </span>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {t.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => publish(t.id)}
                      className="inline-flex items-center gap-1 rounded border border-[var(--accent)]/50 px-2 py-1.5 text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10"
                    >
                      <Rocket size={14} />
                      Publish
                    </button>
                  )}
                  {t.status === "published" && (
                    <button
                      type="button"
                      onClick={() => unpublish(t.id)}
                      className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                    >
                      <Ban size={14} />
                      Unpublish
                    </button>
                  )}
                  <Link
                    href={`/dashboard/marketplace/${t.id}`}
                    className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                  >
                    <Pencil size={14} />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="inline-flex items-center gap-1 rounded border border-[var(--warning)]/30 px-2 py-1.5 text-xs text-[var(--warning)] hover:bg-[var(--warning)]/5"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
