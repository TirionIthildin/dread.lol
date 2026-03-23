"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { PencilSimple, Eye, ArrowSquareOut } from "@phosphor-icons/react";
import { EDITOR_SECTIONS } from "./editorNavConfig";
import { TabButton } from "./TabButton";
import type { EditorSectionId } from "./types";

export function ProfileEditorLayout({
  tab,
  setTab,
  activeEditorSection,
  onSelectSection,
  profileSlug,
  previewIframeRef,
  editorHeaderHint,
  editorScrollChildren,
}: {
  tab: "editor" | "preview";
  setTab: (t: "editor" | "preview") => void;
  activeEditorSection: EditorSectionId;
  onSelectSection: (id: EditorSectionId) => void;
  profileSlug: string;
  previewIframeRef: RefObject<HTMLIFrameElement | null>;
  /** Shown next to the editor title (e.g. Links tab save hint). */
  editorHeaderHint?: ReactNode;
  editorScrollChildren: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden xl:h-[calc(100vh-6rem)]">
      <nav
        className="xl:hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden shrink-0 mb-4"
        aria-label="Profile editor"
      >
        <div className="flex">
          <TabButton active={tab === "editor"} onClick={() => setTab("editor")} icon={<PencilSimple size={18} weight="regular" className="shrink-0" />}>
            Editor
          </TabButton>
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")} icon={<Eye size={18} weight="regular" className="shrink-0" />}>
            Preview
          </TabButton>
        </div>
      </nav>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden xl:flex-row xl:gap-4">
        <section
          className={`animate-dashboard-panel flex flex-1 flex-col min-h-0 xl:flex-[1.2] rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm ${
            tab === "preview" ? "hidden xl:flex" : ""
          } xl:min-w-0`}
          aria-label="Profile editor"
        >
          <div className="border-b border-[var(--border)] px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-[var(--bg)]/80 shrink-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <PencilSimple size={18} weight="regular" className="text-[var(--accent)] shrink-0" aria-hidden />
              <span className="text-sm font-medium text-[var(--foreground)]">Editor</span>
              <span className="text-xs text-[var(--muted)] hidden sm:inline">— edit your profile</span>
              {editorHeaderHint}
            </div>
            <Link
              href={`/${profileSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline shrink-0"
            >
              <ArrowSquareOut size={14} weight="regular" />
              Preview in new tab
            </Link>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[14rem_1fr] xl:grid-cols-[14rem_1fr]">
            <nav
              className="flex w-52 flex-col gap-1 overflow-hidden border-r border-[var(--border)] bg-[var(--bg)]/50 p-3 xl:w-56"
              aria-label="Editor sections"
            >
              {EDITOR_SECTIONS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectSection(id)}
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
              <div className="mt-auto pt-4 border-t border-[var(--border)]">
                <Link
                  href="/marketplace"
                  className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Browse templates →
                </Link>
              </div>
            </nav>
            <div className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-5 lg:p-6 overscroll-contain">{editorScrollChildren}</div>
          </div>
        </section>

        <section
          className={`animate-dashboard-panel flex flex-col flex-1 min-h-0 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm ${
            tab === "editor" ? "hidden xl:flex" : ""
          }`}
          aria-label="Profile preview"
        >
          <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between gap-2 bg-[var(--bg)]/80 shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={18} weight="regular" className="text-[var(--terminal)]" aria-hidden />
              <span className="text-sm font-medium text-[var(--foreground)]">Live preview</span>
              <span className="text-xs text-[var(--muted)] hidden sm:inline">— updates as you type</span>
            </div>
            <Link href={`/${profileSlug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline">
              Open in tab
            </Link>
          </div>
          <div className="flex-1 min-h-0 relative bg-[var(--bg)]">
            <iframe
              ref={previewIframeRef}
              src="/live-preview"
              title="Live profile preview"
              className="absolute inset-0 w-full h-full rounded-b-xl border-0"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
