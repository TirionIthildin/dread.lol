"use client";

import { useEffect, type RefObject } from "react";
import { EDITOR_SECTIONS } from "@/app/dashboard/profile-editor/editorNavConfig";
import type { EditorSectionId } from "@/app/dashboard/profile-editor/types";

export function useEditorSectionFocus(
  activeEditorSection: EditorSectionId,
  panelRef: RefObject<HTMLElement | null>,
  options?: { tab: "editor" | "preview" }
) {
  const tab = options?.tab ?? "editor";

  useEffect(() => {
    if (tab !== "editor") return;
    const id = requestAnimationFrame(() => {
      if (!panelRef.current) return;
      panelRef.current.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [activeEditorSection, tab, panelRef]);
}

export function editorSectionAriaLabel(section: EditorSectionId): string {
  return EDITOR_SECTIONS.find((s) => s.id === section)?.label ?? "Editor";
}
