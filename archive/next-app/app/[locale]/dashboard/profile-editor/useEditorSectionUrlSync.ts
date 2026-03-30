"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { EditorSectionId } from "./types";
import { parseEditorSectionId } from "./types";

const SECTION_PARAM = "section";

/**
 * Keeps `?section=` in sync with the active editor panel and hydrates section from the URL when it differs.
 *
 * Only applies the URL → state direction when the query string actually changed (initial load, back/forward,
 * or an external navigation). Otherwise, after the user picks a section, state updates before `router.replace`
 * runs; the URL would still show the old `section` for one tick and would incorrectly reset state.
 */
export function useEditorSectionUrlSync(
  activeEditorSection: EditorSectionId,
  setActiveEditorSection: React.Dispatch<React.SetStateAction<EditorSectionId>>
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevSearchSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    const serialized = searchParams.toString();
    const hadPrev = prevSearchSerializedRef.current !== null;
    const urlChanged = hadPrev && prevSearchSerializedRef.current !== serialized;
    const isInitialSync = !hadPrev;

    const params = new URLSearchParams(serialized);
    const fromUrl = parseEditorSectionId(params.get(SECTION_PARAM));

    if ((isInitialSync || urlChanged) && fromUrl && fromUrl !== activeEditorSection) {
      setActiveEditorSection(fromUrl);
      prevSearchSerializedRef.current = serialized;
      return;
    }
    if (params.get(SECTION_PARAM) !== activeEditorSection) {
      params.set(SECTION_PARAM, activeEditorSection);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    prevSearchSerializedRef.current = serialized;
  }, [activeEditorSection, pathname, router, searchParams, setActiveEditorSection]);
}
