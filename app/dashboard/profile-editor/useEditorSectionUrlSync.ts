"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { EditorSectionId } from "./types";
import { parseEditorSectionId } from "./types";

const SECTION_PARAM = "section";

/**
 * Keeps `?section=` in sync with the active editor panel and hydrates section from the URL when it differs.
 */
export function useEditorSectionUrlSync(
  activeEditorSection: EditorSectionId,
  setActiveEditorSection: React.Dispatch<React.SetStateAction<EditorSectionId>>
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const fromUrl = parseEditorSectionId(params.get(SECTION_PARAM));
    if (fromUrl && fromUrl !== activeEditorSection) {
      setActiveEditorSection(fromUrl);
      return;
    }
    if (params.get(SECTION_PARAM) !== activeEditorSection) {
      params.set(SECTION_PARAM, activeEditorSection);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [activeEditorSection, pathname, router, searchParams, setActiveEditorSection]);
}
