"use client";

import { useState, useEffect, useCallback } from "react";
import ProfileContent from "@/app/components/ProfileContent";
import ProfileBackground from "@/app/components/ProfileBackground";
import ProfileCursorEffect from "@/app/components/ProfileCursorEffect";
import type { Profile } from "@/lib/profiles";

function profileNeedsUnlock(profile: Profile): boolean {
  const bgType = profile.backgroundType ?? "";
  return bgType === "video" || Boolean(profile.backgroundAudioUrl?.trim());
}

const PREVIEW_STORAGE_KEY = "dread-preview-profile";
const PREVIEW_MESSAGE_TYPE = "dread-preview-update";

const emptyVouches = {
  slug: "preview",
  count: 0,
  vouchedBy: [],
  mutualVouchers: [],
  currentUserHasVouched: false,
  canVouch: false,
};

function parseStoredProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || typeof (parsed as Profile).slug !== "string") {
      return null;
    }
    return parsed as Profile;
  } catch {
    return null;
  }
}

export default function LivePreviewPage() {
  // Always start with null to avoid hydration mismatch (server has no sessionStorage, client might have profile)
  const [profile, setProfile] = useState<Profile | null>(null);
  const [testOverlayVisible, setTestOverlayVisible] = useState(false);

  const refreshFromStorage = useCallback(() => {
    const next = parseStoredProfile();
    if (next) {
      setProfile(next);
      setTestOverlayVisible(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === PREVIEW_MESSAGE_TYPE) {
        refreshFromStorage();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [refreshFromStorage]);

  // Initial load - read from sessionStorage only on client after mount
  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--muted)] text-sm">
        Start editing to see live preview
      </div>
    );
  }

  const needsCursorEffect = profile.cursorStyle === "glow" || profile.cursorStyle === "trail";
  const needsUnlock = profileNeedsUnlock(profile);
  const content = (
    <div className="relative">
      <ProfileContent
        profile={profile}
        vouches={emptyVouches}
        similarProfiles={[]}
        mutualGuilds={[]}
        canReport={false}
        canSubmitReport={false}
      />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {needsUnlock && (
        <div className="shrink-0 flex items-center justify-end gap-2 px-3 py-1.5 bg-[var(--surface)]/80 border-b border-[var(--border)]/50">
          <button
            type="button"
            onClick={() => setTestOverlayVisible(true)}
            className="text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] px-2 py-1 rounded hover:bg-[var(--bg)]/60 transition-colors"
          >
            Test overlay
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ProfileBackground
          profile={profile}
          defaultUnlocked
          testOverlayVisible={testOverlayVisible}
          onTestOverlayDismissed={() => setTestOverlayVisible(false)}
        >
          {needsCursorEffect ? (
            <ProfileCursorEffect cursorStyle={profile.cursorStyle} accentColor={profile.accentColor}>
              {content}
            </ProfileCursorEffect>
          ) : (
            content
          )}
        </ProfileBackground>
      </div>
    </div>
  );
}
