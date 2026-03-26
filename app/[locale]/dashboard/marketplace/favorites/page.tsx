"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Store } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description?: string | null;
  previewUrl?: string | null;
  data: Record<string, unknown>;
  applyCount: number;
}

const iconProps = { size: 18 };

function resolvePreviewUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("/api/files/")) return url;
  return url.startsWith("http") ? url : null;
}

export default function DashboardMarketplaceFavoritesPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace/favorites")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setItems(data.items ?? []))
      .catch(() => toast.error("Failed to load favorites"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">My favorites</h1>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        >
          <Store {...iconProps} />
          Browse marketplace
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] border-dashed p-8 text-center">
          <Heart size={48} className="mx-auto mb-4 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)] mb-4">
            Templates you favorite will appear here. Browse the marketplace and click the heart to save templates.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20"
          >
            <Store {...iconProps} />
            Browse marketplace
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => {
            const previewUrl = resolvePreviewUrl(t.previewUrl) ?? (t.data as { ogImageUrl?: string; backgroundUrl?: string })?.ogImageUrl ?? (t.data as { backgroundUrl?: string })?.backgroundUrl;
            return (
              <Link
                key={t.id}
                href={`/marketplace/${t.id}`}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/30 hover:border-[var(--accent)]/50 hover:bg-[var(--bg)]/50 transition-colors overflow-hidden"
              >
                <div className="aspect-video bg-[var(--bg)]/80 relative">
                  {previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-4xl">
                      {t.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-[var(--foreground)] truncate">{t.name}</h3>
                  {t.description && (
                    <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{t.description}</p>
                  )}
                  <p className="text-xs text-[var(--muted)] mt-1">{t.applyCount} applied</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
