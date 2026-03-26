"use client";

import Link from "next/link";
import { Heart, Store } from "lucide-react";
import type { TemplateRow } from "@/lib/marketplace-templates";
import { MarketplacePreviewImage } from "@/app/components/MarketplacePreviewImage";

const iconProps = { size: 18 };

function resolvePreviewUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("/api/files/")) return url;
  return url.startsWith("http") ? url : null;
}

export default function DashboardMarketplaceFavoritesClient({
  initialItems,
}: {
  initialItems: TemplateRow[];
}) {
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

      {initialItems.length === 0 ? (
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
          {initialItems.map((t) => {
            const data = t.data as { ogImageUrl?: string; backgroundUrl?: string };
            const previewUrl =
              resolvePreviewUrl(t.previewUrl) ?? data?.ogImageUrl ?? data?.backgroundUrl;
            return (
              <Link
                key={t.id}
                href={`/marketplace/${t.id}`}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/30 hover:border-[var(--accent)]/50 hover:bg-[var(--bg)]/50 transition-colors overflow-hidden"
              >
                <div className="aspect-video bg-[var(--bg)]/80 relative">
                  {previewUrl ? (
                    <MarketplacePreviewImage
                      src={previewUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
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
