"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "@phosphor-icons/react";
import { isDiscordCdnHttpsUrl, safeImageLinkHref } from "@/lib/url-validation";

type GalleryItem = {
  id: number;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  sortOrder: number;
};

type Props = {
  slug: string;
  onClose: () => void;
};

export default function ProfileGalleryModal({ slug, onClose }: Props) {
  const [gallery, setGallery] = useState<GalleryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(slug)}/gallery`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load gallery");
        setGallery([]);
        return;
      }
      setGallery(data.gallery ?? []);
    } catch {
      setError("Failed to load gallery");
      setGallery([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-3.5 bg-[var(--bg)]/90 shrink-0">
          <h2 id="gallery-modal-title" className="text-lg font-semibold text-[var(--foreground)]">
            Gallery
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            aria-label="Close"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[var(--muted)]">Loading…</p>
            </div>
          ) : error ? (
            <p className="text-sm text-[var(--warning)] py-4">{error}</p>
          ) : gallery && gallery.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
              {gallery.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg)]/40 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-[var(--border)]"
                >
                  <a
                    href={safeImageLinkHref(item.imageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset rounded-t-xl"
                  >
                    {isDiscordCdnHttpsUrl(item.imageUrl) ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title ?? "Gallery image"}
                        width={400}
                        height={400}
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <Image
                        src={item.imageUrl}
                        alt={item.title ?? "Gallery image"}
                        width={400}
                        height={400}
                        className="w-full aspect-square object-cover"
                        unoptimized
                      />
                    )}
                  </a>
                  <div className="p-3 border-t border-[var(--border)]/60">
                    {item.title ? (
                      <p className="font-medium text-[var(--foreground)] text-sm leading-snug" title={item.title}>
                        {item.title}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--muted)]/80 italic">No caption</p>
                    )}
                    {item.description && (
                      <p
                        className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed line-clamp-3"
                        title={item.description}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-[var(--muted)]">No images in this gallery yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
