"use client";

import Link from "next/link";
import { Images, Plus } from "lucide-react";
import DashboardGallery from "@/app/[locale]/dashboard/DashboardGallery";
import type { GalleryItem } from "@/lib/member-profiles";

type GalleryAddonProduct = { id: string; name: string; priceFormatted: string | null };

type Props = {
  hasGalleryAccess: boolean;
  billingEnabled: boolean;
  galleryAddonProducts: GalleryAddonProduct[];
  profileId: string;
  profileSlug: string;
  initialGallery: GalleryItem[];
};

export default function DashboardGalleryPage({
  hasGalleryAccess,
  billingEnabled,
  galleryAddonProducts,
  profileId,
  profileSlug,
  initialGallery,
}: Props) {
  if (!hasGalleryAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Gallery</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add and manage images shown on your profile. Premium includes gallery, or get the addon.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8 md:p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Images size={32} className="text-[var(--accent)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">Gallery access</h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-sm mx-auto">
            Image hosting is included with Premium, or available as a standalone addon.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard/premium"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-5 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
            >
              Get Premium
            </Link>
            {billingEnabled && galleryAddonProducts.length > 0 && galleryAddonProducts.map((prod) => (
              <Link
                key={prod.id}
                href={`/api/polar/checkout-redirect?product=${prod.id}`}
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Plus size={18} />
                Get addon {prod.priceFormatted && `(${prod.priceFormatted})`}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Gallery</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Add and manage images shown on your profile.
        </p>
      </div>
      <DashboardGallery
        profileId={profileId}
        profileSlug={profileSlug}
        initialGallery={initialGallery}
        hasGalleryAccess
      />
    </div>
  );
}
