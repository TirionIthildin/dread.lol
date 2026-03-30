"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { ProfileRow } from "@/lib/db/schema";
import type { EditorSectionId } from "@/app/[locale]/dashboard/profile-editor/types";

const DISMISS_PREFIX = "dread.profileEditor.sectionTipDismissed.";

function parseLinkCount(profile: ProfileRow): number {
  const raw = profile.links;
  if (!raw || typeof raw !== "string") return 0;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function SectionTip({
  sectionId,
  profile,
  activeSection,
  slugDraft,
  bannerDraft,
  audioTrackCount,
}: {
  sectionId: EditorSectionId;
  profile: ProfileRow;
  activeSection: EditorSectionId;
  /** Current slug field value (draft). */
  slugDraft?: string;
  bannerDraft?: string;
  audioTrackCount?: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  const storageKey = `${DISMISS_PREFIX}${sectionId}`;

  const show = useMemo(() => {
    if (activeSection !== sectionId) return false;
    if (typeof window !== "undefined") {
      try {
        if (window.localStorage.getItem(storageKey) === "1") return false;
      } catch {
        /* ignore */
      }
    }
    if (dismissed) return false;

    switch (sectionId) {
      case "basics": {
        const slugOk = (slugDraft ?? profile.slug ?? "").trim().length >= 2;
        return !slugOk;
      }
      case "links":
        return parseLinkCount(profile) === 0;
      case "banner":
        return !(bannerDraft ?? profile.banner ?? "").trim();
      case "audio":
        return (audioTrackCount ?? 0) === 0 && !(profile as { showAudioPlayer?: boolean }).showAudioPlayer;
      case "fun": {
        const accent = profile.accentColor;
        const hasCustomTheme = Boolean((profile as { pageTheme?: string }).pageTheme && (profile as { pageTheme?: string }).pageTheme !== "classic-dark");
        return !accent && !hasCustomTheme;
      }
      default:
        return false;
    }
  }, [activeSection, sectionId, profile, slugDraft, bannerDraft, audioTrackCount, dismissed, storageKey]);

  if (!show) return null;

  const messages: Partial<Record<EditorSectionId, string>> = {
    basics: "Pick a short URL slug and add a tagline or description so visitors know who you are.",
    links: "Add at least one link so people can find you elsewhere.",
    banner: "Optional: add ASCII text art for a bold header.",
    audio: "Upload tracks and enable the player so visitors can hear your picks on your profile.",
    fun: "Tweak page theme and accent color to match your vibe.",
    discord: "Toggle Discord badges and presence to show how you show up online.",
    extras: "Add tags, skills, or timezone so visitors can connect.",
    terminal: "Enable terminal commands for a CLI-style profile.",
    widgets: "Pick a few widgets — account age, join date, or crypto tickers.",
    versions: "Save a snapshot before big changes so you can restore later.",
  };

  const text = messages[sectionId];
  if (!text) return null;

  return (
    <div className="rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-3 py-2 flex items-start gap-2 text-xs text-[var(--muted)] -mt-1 mb-2">
      <span className="flex-1 min-w-0">{text}</span>
      <button
        type="button"
        className="shrink-0 p-0.5 rounded hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)]"
        aria-label="Dismiss tip"
        onClick={() => {
          try {
            window.localStorage.setItem(storageKey, "1");
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
