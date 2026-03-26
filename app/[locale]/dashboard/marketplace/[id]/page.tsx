"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rocket, Ban, Trash, Eye, Upload, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import SearchableSelect from "@/app/components/SearchableSelect";
import type { TemplateData } from "@/lib/marketplace-templates";
import { ACCENT_THEMES } from "@/lib/profile-themes";

interface Template {
  id: string;
  name: string;
  description?: string | null;
  previewUrl?: string | null;
  data: TemplateData;
  applyCount: number;
  status: string;
}

const iconProps = { size: 18, weight: "regular" as const };
const PREVIEW_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const PREVIEW_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB

export default function DashboardMarketplaceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [data, setData] = useState<TemplateData>({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewUploading, setPreviewUploading] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/marketplace/templates/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((t) => {
        setTemplate(t);
        setName(t.name ?? "");
        setDescription(t.description ?? "");
        setPreviewUrl(t.previewUrl ?? "");
        setData(t.data ?? {});
      })
      .catch(() => toast.error("Template not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePreviewUpload = useCallback(async (file: File) => {
    const type = file.type?.toLowerCase().split(";")[0]?.trim();
    if (!type || !PREVIEW_IMAGE_TYPES.includes(type)) {
      toast.error("Use PNG, JPG, GIF, or WebP");
      return;
    }
    if (file.size > PREVIEW_MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }
    setPreviewUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "gallery");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Upload failed");
        return;
      }
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const url = result.url?.startsWith("http") ? result.url : `${base}${result.url || ""}`;
      setPreviewUrl(url);
      toast.success("Preview image uploaded");
    } finally {
      setPreviewUploading(false);
    }
  }, []);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/marketplace/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          previewUrl: previewUrl.trim() || null,
          data,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed");
      }
      toast.success("Saved");
      setTemplate((t) =>
        t
          ? {
              ...t,
              name: name.trim(),
              description: description.trim(),
              previewUrl: previewUrl.trim() || null,
              data,
            }
          : t
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!id) return;
    const res = await fetch(`/api/marketplace/templates/${id}/publish`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
      return;
    }
    toast.success("Published");
    setTemplate((t) => (t ? { ...t, status: "published" } : t));
    router.refresh();
  }

  async function unpublish() {
    if (!id) return;
    const res = await fetch(`/api/marketplace/templates/${id}/unpublish`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
      return;
    }
    toast.success("Unpublished");
    setTemplate((t) => (t ? { ...t, status: "unpublished" } : t));
    router.refresh();
  }

  async function remove() {
    if (!id) return;
    if (!confirm("Delete this template? This cannot be undone.")) return;
    const res = await fetch(`/api/marketplace/templates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
      return;
    }
    toast.success("Deleted");
    router.push("/dashboard/marketplace");
    router.refresh();
  }

  const updateData = (key: keyof TemplateData, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  let linksJson = "[]";
  try {
    const raw = data.links;
    linksJson =
      typeof raw === "string"
        ? raw
        : raw
          ? JSON.stringify(raw, null, 2)
          : "[]";
  } catch {
    linksJson = "[]";
  }

  if (loading || !template) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/marketplace" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
          ← My templates
        </Link>
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard/marketplace" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
          ← My templates
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/marketplace/${id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            <Eye {...iconProps} />
            Preview
          </a>
          {template.status === "draft" && (
            <button
              type="button"
              onClick={publish}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20"
            >
              <Rocket size={18} />
              Publish
            </button>
          )}
          {template.status === "published" && (
            <button
              type="button"
              onClick={unpublish}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            >
              <Ban size={18} />
              Unpublish
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--warning)]/30 px-3 py-2 text-sm text-[var(--warning)] hover:bg-[var(--warning)]/5"
          >
            <Trash size={18} />
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)]"
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)]"
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Preview image</label>
          <p className="text-xs text-[var(--muted)] mb-2">
            Shown in marketplace cards. PNG, JPG, GIF, WebP, max 5 MB.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {previewUrl && (
              <div className="relative w-24 h-14 rounded border border-[var(--border)] overflow-hidden bg-[var(--bg)]/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] cursor-pointer">
              <Upload size={16} />
              {previewUploading ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                disabled={previewUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePreviewUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            {previewUrl && (
              <button
                type="button"
                onClick={() => setPreviewUrl("")}
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowContent(!showContent)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"
          >
            {showContent ? (
              <ChevronDown size={16} strokeWidth={2.5} />
            ) : (
              <ChevronRight size={16} strokeWidth={2.5} />
            )}
            Edit template content
          </button>
          {showContent && (
            <div className="mt-4 space-y-4 pl-2 border-l-2 border-[var(--border)]">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Tagline</label>
                <input
                  type="text"
                  value={data.tagline ?? ""}
                  onChange={(e) => updateData("tagline", e.target.value || null)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  maxLength={120}
                  placeholder="Short headline"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Profile description</label>
                <textarea
                  value={data.description ?? ""}
                  onChange={(e) => updateData("description", e.target.value || null)}
                  rows={4}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  maxLength={2000}
                  placeholder="About you / bio"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Banner (emoji or text)</label>
                <input
                  type="text"
                  value={data.banner ?? ""}
                  onChange={(e) => updateData("banner", e.target.value || null)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  placeholder="e.g. 🎮 or custom text"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Accent color</label>
                <SearchableSelect
                  value={data.accentColor ?? ""}
                  onChange={(v) => updateData("accentColor", v || null)}
                  options={[
                    { value: "", label: "Default" },
                    ...ACCENT_THEMES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
                  ]}
                  searchPlaceholder="Search…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Background URL (image or video)
                </label>
                <input
                  type="url"
                  value={data.backgroundUrl ?? ""}
                  onChange={(e) => updateData("backgroundUrl", e.target.value || null)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm"
                  placeholder="https://… or /api/files/…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                  Links (JSON array of {"{ label, href }"} objects)
                </label>
                <textarea
                  value={linksJson}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    if (!val) {
                      updateData("links", null);
                      return;
                    }
                    try {
                      const parsed = JSON.parse(val);
                      updateData("links", Array.isArray(parsed) ? JSON.stringify(parsed) : null);
                    } catch {
                      updateData("links", val);
                    }
                  }}
                  rows={6}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono text-xs"
                  placeholder='[{"label":"Discord","href":"https://discord.gg/..."}]'
                />
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--muted)]">
          {template.applyCount} applied · Status: {template.status}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
