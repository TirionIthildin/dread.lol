"use client";

import Link from "next/link";
import { Eyedropper } from "@phosphor-icons/react";

export default function MarketplaceAdminPreviewLink({ templateId }: { templateId: string }) {
  return (
    <Link
      href={`/marketplace/${templateId}/preview`}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
    >
      <Eyedropper size={18} weight="regular" />
      Preview as profile
    </Link>
  );
}
