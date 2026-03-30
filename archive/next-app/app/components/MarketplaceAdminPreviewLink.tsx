"use client";

import Link from "next/link";
import { Pipette } from "lucide-react";

export default function MarketplaceAdminPreviewLink({ templateId }: { templateId: string }) {
  return (
    <Link
      href={`/marketplace/${templateId}/preview`}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
    >
      <Pipette size={18} />
      Preview as profile
    </Link>
  );
}
