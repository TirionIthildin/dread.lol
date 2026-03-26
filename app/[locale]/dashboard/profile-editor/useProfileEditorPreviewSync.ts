"use client";

import { useEffect, type RefObject } from "react";
import type { Profile } from "@/lib/profiles";
import { PREVIEW_MESSAGE_TYPE, PREVIEW_STORAGE_KEY } from "./constants";

export function useProfileEditorPreviewSync(
  previewProfile: Profile | null,
  previewIframeRef: RefObject<HTMLIFrameElement | null>
) {
  useEffect(() => {
    if (!previewProfile || typeof window === "undefined") return;
    const id = window.setTimeout(() => {
      try {
        sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(previewProfile));
        previewIframeRef.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE_TYPE }, window.location.origin);
      } catch {
        /* ignore */
      }
    }, 48);
    return () => window.clearTimeout(id);
  }, [previewProfile, previewIframeRef]);
}
