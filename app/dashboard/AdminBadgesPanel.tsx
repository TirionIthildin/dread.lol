"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import NextImage from "next/image";
import {
  createBadgeAction,
  updateBadgeAction,
  deleteBadgeAction,
} from "@/app/dashboard/actions";
import { BADGE_ICON_OPTIONS, getBadgeIcon } from "@/lib/badge-icons";

export type CustomBadge = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  color?: string | null;
  sortOrder: number;
  badgeType?: string | null;
  imageUrl?: string | null;
  iconName?: string | null;
};

export default function AdminBadgesPanel() {
  const [badges, setBadges] = useState<CustomBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formBadgeType, setFormBadgeType] = useState<"label" | "image" | "icon">("label");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIconName, setFormIconName] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/admin/badges");
      if (!res.ok) return;
      const data = await res.json();
      setBadges(data.badges ?? []);
      setError(null);
    } catch {
      setError("Failed to load badges");
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  function clearForm() {
    setFormKey("");
    setFormLabel("");
    setFormDescription("");
    setFormColor("");
    setFormSortOrder(0);
    setFormBadgeType("label");
    setFormImageUrl("");
    setFormIconName("");
    setEditingId(null);
  }

  function startEdit(b: CustomBadge) {
    setEditingId(b.id);
    setFormKey(b.key);
    setFormLabel(b.label);
    setFormDescription(b.description ?? "");
    setFormColor(b.color ?? "");
    setFormSortOrder(b.sortOrder);
    setFormBadgeType((b.badgeType as "label" | "image" | "icon") || "label");
    setFormImageUrl(b.imageUrl ?? "");
    setFormIconName(b.iconName ?? "");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.url) {
        setFormImageUrl(data.url);
      }
    } catch {
      setError("Upload failed");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createBadgeAction({
        key: formKey,
        label: formLabel,
        description: formDescription || undefined,
        color: formColor || undefined,
        sortOrder: formSortOrder,
        badgeType: formBadgeType,
        imageUrl: formBadgeType === "image" ? (formImageUrl || undefined) : "",
        iconName: formBadgeType === "icon" ? (formIconName || undefined) : "",
      });
      if (result.error) {
        setError(result.error);
      } else {
        clearForm();
        fetchBadges();
      }
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId == null) return;
    setError(null);
    startTransition(async () => {
      const result = await updateBadgeAction(editingId, {
        key: formKey,
        label: formLabel,
        description: formDescription || undefined,
        color: formColor || undefined,
        sortOrder: formSortOrder,
        badgeType: formBadgeType,
        imageUrl: formBadgeType === "image" ? (formImageUrl || undefined) : "",
        iconName: formBadgeType === "icon" ? (formIconName || undefined) : "",
      });
      if (result.error) {
        setError(result.error);
      } else {
        clearForm();
        fetchBadges();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this badge? It will be removed from all users.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteBadgeAction(id);
      if (result.error) setError(result.error);
      else fetchBadges();
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
      <p className="text-sm text-[var(--muted)]">
        Create custom badges and assign them to users in User management. Staff and Verified are fixed and managed per user there.
      </p>

      <form
        onSubmit={editingId != null ? handleUpdate : handleCreate}
        className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 space-y-3"
      >
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          {editingId != null ? "Edit badge" : "Add badge"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Key (slug, unique)</label>
            <input
              type="text"
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              placeholder="e.g. partner"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              required
              disabled={!!editingId}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Label</label>
            <input
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder="e.g. Partner"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-[var(--muted)] mb-1">Description (optional, for tooltip)</label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g. Official partner"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-[var(--muted)] mb-1.5">Color (optional)</label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: "", label: "Default" },
                { value: "amber", hex: "#f59e0b" },
                { value: "green", hex: "#10b981" },
                { value: "purple", hex: "#8b5cf6" },
                { value: "cyan", hex: "#06b6d4" },
                { value: "rose", hex: "#f43f5e" },
                { value: "orange", hex: "#f97316" },
              ].map((preset) => {
                const isActive =
                  preset.value === "" ? !formColor : formColor?.toLowerCase() === preset.value;
                return (
                  <button
                    key={preset.value || "default"}
                    type="button"
                    onClick={() => setFormColor(preset.value)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-bright)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {preset.hex ? (
                      <span
                        className="size-4 rounded-full border border-[var(--border)] shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                    ) : (
                      <span className="size-4 rounded-full border border-[var(--border)] shrink-0 bg-[var(--surface)]" />
                    )}
                    {preset.value || "Default"}
                  </button>
                );
              })}
              <div className="flex items-center gap-2 ml-1">
                <input
                  type="color"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(formColor ?? "")
                      ? (formColor as string)
                      : { amber: "#f59e0b", green: "#10b981", purple: "#8b5cf6", cyan: "#06b6d4", rose: "#f43f5e", orange: "#f97316" }[
                          formColor?.toLowerCase() ?? ""
                        ] ?? "#06b6d4"
                  }
                  onChange={(e) => setFormColor(e.target.value)}
                  className="size-8 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-[var(--border)]"
                  title="Pick custom color"
                />
                <input
                  type="text"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  placeholder="#hex or preset"
                  className="w-24 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  title="Hex (e.g. #8b5cf6) or preset name"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Sort order</label>
            <input
              type="number"
              value={formSortOrder}
              onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs text-[var(--muted)] mb-1">Badge display</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="badgeType"
                  checked={formBadgeType === "label"}
                  onChange={() => setFormBadgeType("label")}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm">Text only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="badgeType"
                  checked={formBadgeType === "image"}
                  onChange={() => setFormBadgeType("image")}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm">Upload image</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="badgeType"
                  checked={formBadgeType === "icon"}
                  onChange={() => setFormBadgeType("icon")}
                  className="rounded border-[var(--border)]"
                />
                <span className="text-sm">Phosphor icon</span>
              </label>
            </div>
            {formBadgeType === "image" && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
                  >
                    {imageUploading ? "Uploading…" : "Choose image"}
                  </button>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Or paste image URL (e.g. /api/files/…)"
                    className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                {formImageUrl && (formImageUrl.startsWith("/") || formImageUrl.startsWith("http")) && (
                  <div className="inline-flex items-center gap-1.5">
                    <div className="rounded border border-[var(--border)] overflow-hidden bg-[var(--surface)] w-7 h-7 flex items-center justify-center">
                      <NextImage
                        src={formImageUrl}
                        alt="Badge preview"
                        width={28}
                        height={28}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs text-[var(--muted)]">Preview</span>
                  </div>
                )}
              </div>
            )}
            {formBadgeType === "icon" && (
              <select
                value={formIconName}
                onChange={(e) => setFormIconName(e.target.value)}
                className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {BADGE_ICON_OPTIONS.map((opt) => (
                  <option key={opt.value || "none"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
          >
            {isPending ? "Saving…" : editingId != null ? "Save" : "Add badge"}
          </button>
          {editingId != null && (
            <button
              type="button"
              onClick={clearForm}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="text-sm text-[var(--warning)]" role="alert">
          {error}
        </p>
      )}

      <div>
        <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Custom badges</h3>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : badges.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No custom badges yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {badges.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium bg-[var(--accent)]/15 text-[var(--accent)]"
                    style={
                      b.color?.startsWith("#")
                        ? { backgroundColor: `${b.color}20`, color: b.color }
                        : undefined
                    }
                  >
                    {b.imageUrl && (b.imageUrl.startsWith("/") || b.imageUrl.startsWith("http")) ? (
                      <NextImage src={b.imageUrl} alt="" width={14} height={14} className="shrink-0 object-contain" unoptimized />
                    ) : b.iconName ? (
                      getBadgeIcon(b.iconName)
                    ) : null}
                    {b.label}
                  </span>
                  <span className="text-xs text-[var(--muted)] font-mono">{b.key}</span>
                  {b.description && (
                    <span className="text-xs text-[var(--muted)] truncate max-w-[12rem]" title={b.description}>
                      {b.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    disabled={isPending}
                    className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    disabled={isPending}
                    className="rounded px-2 py-1 text-xs text-[var(--warning)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
                  >
                    Delete
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
