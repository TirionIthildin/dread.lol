"use client";

import Link from "next/link";
import NextImage from "next/image";
import { ImagesSquare, Trash } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import type { GalleryItem } from "@/lib/member-profiles";
import { isDiscordCdnHttpsUrl, safeImageLinkHref } from "@/lib/url-validation";
import {
  addGalleryItemAction,
  updateGalleryItemAction,
  deleteGalleryItemAction,
} from "@/app/dashboard/actions";

const dashIcon = { size: 14, weight: "regular" as const, className: "shrink-0" };

type Props = {
  profileId: string;
  profileSlug: string;
  initialGallery: GalleryItem[];
  /** When false, user sees upgrade message and cannot add images. */
  hasGalleryAccess?: boolean;
};

export default function DashboardGallery({ profileId, profileSlug, initialGallery, hasGalleryAccess = false }: Props) {
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const atGalleryLimit = !hasGalleryAccess;
  const [galleryAddUrl, setGalleryAddUrl] = useState("");
  const [galleryAddTitle, setGalleryAddTitle] = useState("");
  const [galleryAddDescription, setGalleryAddDescription] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryAddError, setGalleryAddError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setGallery(initialGallery);
  }, [initialGallery]);

  return (
    <section className="animate-dashboard-panel rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
      <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between gap-2 bg-[var(--bg)]/80">
        <span className="text-xs text-[var(--muted)] font-mono inline-flex items-center gap-2">
          <ImagesSquare {...dashIcon} /> Gallery
        </span>
        <Link
          href="/dashboard"
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Back to profile
        </Link>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-xs text-[var(--muted)]">
          Add images with optional captions and descriptions. They appear in the gallery on your profile at{" "}
          <Link href={`/${profileSlug}`} className="text-[var(--accent)] hover:underline">
            /{profileSlug}
          </Link>
          .
        </p>
        {gallery.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0 m-0">
            {gallery.map((item) => (
              <li key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-3 p-3">
                  <a
                    href={safeImageLinkHref(item.imageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {isDiscordCdnHttpsUrl(item.imageUrl) ? (
                      <NextImage src={item.imageUrl} alt={item.title ?? "Gallery image"} width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      <NextImage src={item.imageUrl} alt={item.title ?? "Gallery image"} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                    )}
                  </a>
                  <div className="min-w-0 flex-1">
                    {editingItemId === item.id ? (
                      <>
                        <label className="block text-xs font-medium text-[var(--muted)] mb-0.5">Caption</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Short title or caption"
                          maxLength={200}
                          className="block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-1.5 text-sm mb-2 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                        <label className="block text-xs font-medium text-[var(--muted)] mb-0.5">Description</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Optional longer description"
                          maxLength={1000}
                          rows={2}
                          className="block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-1.5 text-sm resize-y min-h-[60px] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await updateGalleryItemAction(item.id, { title: editTitle || undefined, description: editDescription || undefined });
                              if (res.error) setGalleryAddError(res.error);
                              else {
                                setEditingItemId(null);
                                setGallery((prev) => prev.map((p) => (p.id === item.id ? { ...p, title: editTitle || undefined, description: editDescription || undefined } : p)));
                              }
                            }}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
                          >
                            Save
                          </button>
                          <button type="button" onClick={() => { setEditingItemId(null); setEditTitle(""); setEditDescription(""); }} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-hover)]">
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {item.title ? (
                          <p className="text-sm font-medium text-[var(--foreground)] leading-snug">{item.title}</p>
                        ) : (
                          <p className="text-xs text-[var(--muted)] italic">No caption</p>
                        )}
                        {item.description && (
                          <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => { setEditingItemId(item.id); setEditTitle(item.title ?? ""); setEditDescription(item.description ?? ""); }}
                            className="text-xs text-[var(--accent)] hover:underline font-medium"
                          >
                            Edit caption & description
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="text-xs text-[var(--muted)] hover:text-[var(--warning)] inline-flex items-center gap-1"
                            aria-label="Delete"
                          >
                            <Trash size={12} /> Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)]/40 p-4 space-y-4">
          {atGalleryLimit && (
            <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3 text-sm text-[var(--muted)]">
              Image hosting requires Premium or the Gallery addon. <Link href="/dashboard/gallery" className="text-[var(--accent)] hover:underline">Get access</Link>
            </div>
          )}
          <p className="text-sm font-medium text-[var(--foreground)]">
            Add image
          </p>
          {galleryAddError && <p className="text-xs text-[var(--warning)]">{galleryAddError}</p>}
            <label className={`block text-xs font-medium text-[var(--muted)] ${atGalleryLimit ? "opacity-60 pointer-events-none" : ""}`}>
            Upload (JPEG, PNG, GIF, WebP, SVG, max 5 MiB)
            <input
              type="file"
              disabled={atGalleryLimit || galleryUploading}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              className="mt-1 block w-full text-sm text-[var(--muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--accent)]/20 file:px-3 file:py-1.5 file:text-xs file:text-[var(--accent)] file:font-medium"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setGalleryAddError(null);
                setGalleryUploading(true);
                try {
                  const form = new FormData();
                  form.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: form });
                  const data = await res.json();
                  if (!res.ok) {
                    setGalleryAddError(data.error ?? "Upload failed");
                    return;
                  }
                  const result = await addGalleryItemAction(profileId, { imageUrl: data.url, title: galleryAddTitle || undefined, description: galleryAddDescription || undefined });
                  if (result.error) setGalleryAddError(result.error);
                  else {
                    setGallery((prev) => [...prev, { id: result.id!, imageUrl: data.url, title: galleryAddTitle || undefined, description: galleryAddDescription || undefined, sortOrder: prev.length }]);
                    setGalleryAddTitle("");
                    setGalleryAddDescription("");
                    toast.success("Image added to gallery");
                  }
                } finally {
                  setGalleryUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          <p className="text-xs text-[var(--muted)]">Or paste image URL</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="sm:col-span-2 text-xs font-medium text-[var(--muted)]">
              Image URL
              <input
                type="url"
                value={galleryAddUrl}
                onChange={(e) => setGalleryAddUrl(e.target.value)}
                placeholder="https://… or /api/files/…"
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
            <label className="text-xs font-medium text-[var(--muted)]">
              Caption <span className="text-[var(--muted)]/80">(short title, optional)</span>
              <input
                type="text"
                value={galleryAddTitle}
                onChange={(e) => setGalleryAddTitle(e.target.value)}
                placeholder="e.g. Sunset at the pier"
                maxLength={200}
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
            <label className="text-xs font-medium text-[var(--muted)]">
              Description <span className="text-[var(--muted)]/80">(optional longer text)</span>
              <textarea
                value={galleryAddDescription}
                onChange={(e) => setGalleryAddDescription(e.target.value)}
                placeholder="Add context, story, or details…"
                maxLength={1000}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm resize-y min-h-[56px] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={!galleryAddUrl.trim() || galleryUploading || atGalleryLimit}
            onClick={async () => {
              setGalleryAddError(null);
              const result = await addGalleryItemAction(profileId, {
                imageUrl: galleryAddUrl.trim(),
                title: galleryAddTitle.trim() || undefined,
                description: galleryAddDescription.trim() || undefined,
              });
              if (result.error) setGalleryAddError(result.error);
              else {
                setGallery((prev) => [...prev, { id: result.id!, imageUrl: galleryAddUrl.trim(), title: galleryAddTitle || undefined, description: galleryAddDescription || undefined, sortOrder: prev.length }]);
                setGalleryAddUrl("");
                setGalleryAddTitle("");
                setGalleryAddDescription("");
                toast.success("Image added to gallery");
              }
            }}
            className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to gallery
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={itemToDelete != null}
        title="Remove image?"
        message="This image will be removed from your gallery."
        confirmLabel="Remove"
        variant="danger"
        loading={deleting}
        onConfirm={async () => {
          if (!itemToDelete) return;
          setDeleting(true);
          setGalleryAddError(null);
          const res = await deleteGalleryItemAction(itemToDelete.id);
          setDeleting(false);
          if (res.error) {
            setGalleryAddError(res.error);
            toast.error(res.error);
          } else {
            setGallery((prev) => prev.filter((p) => p.id !== itemToDelete.id));
            setItemToDelete(null);
            toast.success("Image removed from gallery");
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </section>
  );
}
