"use client";

import { useState, useCallback, useRef } from "react";
import type { Profile } from "@/lib/profiles";
import { getThemeClass } from "@/lib/profile-themes";

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

const BUILT_IN_BACKGROUNDS = ["grid", "gradient", "dither"] as const;

export default function ProfileBackground({ profile, children }: ProfileBackgroundProps) {
  const [unlocked, setUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const customBgType = ["image", "video"].includes(profile.backgroundType ?? "")
    ? profile.backgroundType
    : null;
  const builtInBg = BUILT_IN_BACKGROUNDS.includes(profile.backgroundType as (typeof BUILT_IN_BACKGROUNDS)[number])
    ? (profile.backgroundType as (typeof BUILT_IN_BACKGROUNDS)[number])
    : null;
  const backgroundUrl = profile.backgroundUrl?.trim();
  const backgroundAudioUrl = profile.backgroundAudioUrl?.trim();

  const themeClass = getThemeClass(profile.accentColor);
  const hasVisualBackground = customBgType === "image" || customBgType === "video" || !!builtInBg;
  const needsUnlock = (customBgType === "video") || !!backgroundAudioUrl;

  const handleUnlock = useCallback(() => {
    if (customBgType === "video" && videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
    if (backgroundAudioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    setUnlocked(true);
  }, [customBgType, backgroundAudioUrl]);

  const content = (
    <div className="relative z-10 w-full min-h-0 flex-1 flex flex-col items-center justify-center">
      {children}
    </div>
  );

  const unlockOverlay = needsUnlock && !unlocked && (
    <button
      type="button"
      onClick={handleUnlock}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset"
      aria-label="Click to view profile and play media"
    >
      <span className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface)]/95 px-7 py-4 text-lg font-medium text-[var(--foreground)] shadow-xl transition-all duration-200 hover:border-[var(--accent)]/70 hover:bg-[var(--surface)]">
        Click here to view profile
      </span>
    </button>
  );

  /** Themed vignette + gradient overlay on image/video backgrounds for better legibility and cohesion. */
  const themedOverlay = (customBgType === "image" || customBgType === "video") && (
    <div
      className="pointer-events-none fixed inset-0 z-[1]"
      aria-hidden
      style={{
        background: `
          radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(8,9,10,0.5) 70%, rgba(8,9,10,0.85) 100%),
          linear-gradient(180deg, rgba(8,9,10,0.3) 0%, transparent 25%, transparent 75%, rgba(8,9,10,0.4) 100%)
        `,
      }}
    />
  );

  const wrapperClassName = themeClass ? `min-h-screen flex flex-col ${themeClass}` : "min-h-screen flex flex-col";

  if (builtInBg) {
    const bgClass =
      builtInBg === "grid"
        ? "profile-bg-grid"
        : builtInBg === "gradient"
          ? "profile-bg-gradient"
          : "profile-bg-dither";
    return (
      <div className={wrapperClassName}>
        <div
          className={`fixed inset-0 z-0 overflow-hidden ${bgClass}`}
          aria-hidden
        />
        {backgroundAudioUrl && (
          <audio
            ref={audioRef}
            src={resolveMediaUrl(backgroundAudioUrl)}
            loop
            preload="metadata"
            className="sr-only"
            aria-hidden
          />
        )}
        {unlockOverlay}
        {content}
      </div>
    );
  }

  if (customBgType === "image" && backgroundUrl) {
    const resolvedImageUrl = resolveMediaUrl(backgroundUrl);
    return (
      <div className={wrapperClassName}>
        <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <img
            src={resolvedImageUrl}
            alt=""
            className="absolute left-1/2 top-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
            style={{
              width: "max(100vw, 177.78vh)",
              height: "max(100vh, 56.25vw)",
            }}
          />
        </div>
        {themedOverlay}
        {backgroundAudioUrl && (
          <audio
            ref={audioRef}
            src={resolveMediaUrl(backgroundAudioUrl)}
            loop
            preload="metadata"
            className="sr-only"
            aria-hidden
          />
        )}
        {unlockOverlay}
        {content}
      </div>
    );
  }

  if (customBgType === "video" && backgroundUrl) {
    const resolvedUrl = resolveMediaUrl(backgroundUrl);
    if (!resolvedUrl) return <>{children}</>;

    return (
      <div className={wrapperClassName}>
        <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <video
            ref={videoRef}
            src={resolvedUrl}
            autoPlay
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
        {themedOverlay}
        {backgroundAudioUrl && (
          <audio
            ref={audioRef}
            src={resolveMediaUrl(backgroundAudioUrl)}
            loop
            preload="metadata"
            className="sr-only"
            aria-hidden
          />
        )}
        {unlockOverlay}
        {content}
      </div>
    );
  }

  if (backgroundAudioUrl) {
    const resolvedUrl = resolveMediaUrl(backgroundAudioUrl);
    if (!resolvedUrl) return <>{children}</>;

    return (
      <div className={themeClass ? `min-h-screen flex flex-col ${themeClass}` : "min-h-screen flex flex-col"}>
        <audio ref={audioRef} src={resolvedUrl} loop preload="metadata" className="sr-only" aria-hidden />
        {unlockOverlay}
        {content}
      </div>
    );
  }

  return <>{children}</>;
}
