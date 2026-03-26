"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";

const iconProps = { size: 20, strokeWidth: 1.5 as const, className: "shrink-0 text-current" };

type Props = {
  slug: string;
};

export default function ProfileBlogButton({ slug }: Props) {
  return (
    <Link
      href={`/${slug}/blog`}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
    >
      <Newspaper {...iconProps} aria-hidden />
      Blog
    </Link>
  );
}
