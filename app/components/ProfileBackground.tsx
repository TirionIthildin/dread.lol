"use client";

import { useState, useCallback, useRef } from "react";
import type { Profile } from "@/lib/profiles";

/** Resolve URL for media (handles relative paths). */
function resolveMediaUrl(url: string): string {
  if (!url?.trim()) return "";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return typeof window !== "undefined" ? `${window.location.origin}${u}` : u;
  return u;
}

interface ProfileBackgroundProps {
  profile: Profile;
  children: React.ReactNode;
}

export default function ProfileBackground({ profile, children }: ProfileBackgroundProps) {
  const [unlocked, setUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const backgroundType = ["image", "video", "audio"].includes(profile.backgroundType ?? "")
    ? profile.backgroundType
    : null;
  const backgroundUrl = profile.backgroundUrl?.trim();

  const handleUnlock = useCallback(() => {
    if (backgroundType === "video" && videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
    if (backgroundType === "audio" && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    setUnlocked(true);
  }, [backgroundType]);

  if (!backgroundType || !backgroundUrl) {
    return <>{children}</>;
  }

  if (backgroundType === "image") {
    return (
      <>
        <div
          className="fixed inset-0 z-0"
          aria-hidden
          style={{
            backgroundImage: `url("${backgroundUrl.replace(/"/g, "%22")}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 w-full min-h-0 flex-1 flex flex-col items-center justify-center">
          {children}
        </div>
      </>
    );
  }

  if (backgroundType === "audio") {
    const resolvedUrl = resolveMediaUrl(backgroundUrl);
    if (!resolvedUrl) return <>{children}</>;

    return (
      <>
        <audio ref={audioRef} src={resolvedUrl} loop preload="metadata" className="sr-only" aria-hidden />
        {!unlocked && (
          <button
            type="button"
            onClick={handleUnlock}
            className="fixed inset-0 z-[5] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset"
            aria-label="Click to view profile and play background audio"
          >
            <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 px-6 py-4 text-lg font-medium text-[var(--foreground)] shadow-xl transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface)]">
              Click here to view profile
            </span>
          </button>
        )}
        <div className="relative z-10 w-full min-h-0 flex-1 flex flex-col items-center justify-center">
          {children}
        </div>
      </>
    );
  }

  if (backgroundType === "video") {
    const resolvedUrl = resolveMediaUrl(backgroundUrl);
    if (!resolvedUrl) return <>{children}</>;

    return (
      <>
        <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <video
            ref={videoRef}
            src={resolvedUrl}
            autoPlay={unlocked}
            loop
            muted={!unlocked}
            playsInline
            preload="metadata"
            className="absolute left-1/2 top-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
            style={{
              width: "max(100vw, 177.78vh)",
              height: "max(100vh, 56.25vw)",
              opacity: unlocked ? 1 : 0.3,
            }}
          />
        </div>
        {!unlocked && (
          <button
            type="button"
            onClick={handleUnlock}
            className="fixed inset-0 z-[5] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset"
            aria-label="Click to view profile and play background video"
          >
            <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 px-6 py-4 text-lg font-medium text-[var(--foreground)] shadow-xl transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface)]">
              Click here to view profile
            </span>
          </button>
        )}
        <div className="relative z-10 w-full min-h-0 flex-1 flex flex-col items-center justify-center">
          {children}
        </div>
      </>
    );
  }

  return <>{children}</>;
}
