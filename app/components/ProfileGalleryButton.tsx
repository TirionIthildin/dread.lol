"use client";

import { useState } from "react";
import { ImagesSquare } from "@phosphor-icons/react";
import ProfileGalleryModal from "@/app/components/ProfileGalleryModal";

const iconProps = { size: 20, weight: "regular" as const, className: "shrink-0 text-current" };

type Props = {
  slug: string;
};

export default function ProfileGalleryButton({ slug }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
      >
        <ImagesSquare {...iconProps} aria-hidden />
        Gallery
      </button>
      {open && <ProfileGalleryModal slug={slug} onClose={() => setOpen(false)} />}
    </>
  );
}
