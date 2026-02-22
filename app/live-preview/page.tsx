"use client";

import { useState, useEffect, useCallback } from "react";
import ProfileContent from "@/app/components/ProfileContent";
import ProfileBackground from "@/app/components/ProfileBackground";
import ProfileCursorEffect from "@/app/components/ProfileCursorEffect";
import type { Profile } from "@/lib/profiles";

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
  const [profile, setProfile] = useState<Profile | null>(() => parseStoredProfile());

  const refreshFromStorage = useCallback(() => {
    const next = parseStoredProfile();
    if (next) setProfile(next);
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

  // Initial load - parent may have written before iframe loaded
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
    <ProfileBackground profile={profile}>
      {needsCursorEffect ? (
        <ProfileCursorEffect cursorStyle={profile.cursorStyle} accentColor={profile.accentColor}>
          {content}
        </ProfileCursorEffect>
      ) : (
        content
      )}
    </ProfileBackground>
  );
}
