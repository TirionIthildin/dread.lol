"use client";

import Link from "next/link";
import { Link as I18nLink } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { EDITOR_SECTIONS } from "@/app/[locale]/dashboard/profile-editor/editorNavConfig";
import { useProfileEditorSection } from "@/app/[locale]/dashboard/profile-editor/ProfileEditorSectionContext";

/**
 * Left column section navigation for the profile editor (replaces the main dashboard sidebar on this route).
 */
export function ProfileEditorSectionRail() {
  const { activeEditorSection, setActiveEditorSection } = useProfileEditorSection();

  return (
    <nav
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-4 md:px-3 md:py-5"
      aria-label="Editor sections"
    >
      <div className="mb-4 shrink-0 px-1">
        <I18nLink
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
          Dashboard
        </I18nLink>
        <p className="mt-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]/60">Sections</p>
      </div>
      {EDITOR_SECTIONS.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setActiveEditorSection(id)}
          aria-current={activeEditorSection === id ? "true" : undefined}
          className={`inline-flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            activeEditorSection === id
              ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
              : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
          }`}
        >
          {icon}
          <span className="truncate">{label}</span>
        </button>
      ))}
      <div className="mt-auto shrink-0 border-t border-[var(--border)]/60 pt-4">
        <Link
          href="/marketplace"
          className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)] transition-colors"
        >
          Browse templates →
        </Link>
      </div>
    </nav>
  );
}
