"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Profile } from "@/lib/profiles";
import { getThemeClass, getProfileCursorProps, getCustomColorVars } from "@/lib/profile-themes";

const FADE_MS = 350;

function fadeAudio(audio: HTMLAudioElement, toVolume: number, onDone?: () => void): void {
  const start = audio.volume;
  const diff = toVolume - start;
  const startTime = performance.now();
  const step = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / FADE_MS);
    const eased = 1 - (1 - t) ** 2;
    audio.volume = Math.max(0, Math.min(1, start + diff * eased));
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}

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
  /** When true (e.g. live preview), start unlocked so no overlay blocks the view. */
  defaultUnlocked?: boolean;
  /** When true, show the unlock overlay for testing (e.g. from live preview "Test overlay" button). */
  testOverlayVisible?: boolean;
  /** Called when user clicks the overlay in test mode. */
  onTestOverlayDismissed?: () => void;
}

const BUILT_IN_BACKGROUNDS = ["grid", "gradient", "dither"] as const;

export default function ProfileBackground({ profile, children, defaultUnlocked = false, testOverlayVisible = false, onTestOverlayDismissed }: ProfileBackgroundProps) {
  const [unlocked, setUnlocked] = useState(defaultUnlocked);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const customBgType = ["image", "video"].includes(profile.backgroundType ?? "")
    ? profile.backgroundType
    : null;
  const builtInBg = (() => {
    const t = profile.backgroundType ?? "";
    if (BUILT_IN_BACKGROUNDS.includes(t as (typeof BUILT_IN_BACKGROUNDS)[number])) {
      return t as (typeof BUILT_IN_BACKGROUNDS)[number];
    }
    if (t === "") return "grid"; // empty/none defaults to grid
    return null;
  })();
  const backgroundUrl = profile.backgroundUrl?.trim();
  const backgroundAudioUrl = profile.backgroundAudioUrl?.trim();

  const themeClass = getThemeClass(profile.accentColor);
  const { cursorClass, cursorStyle } = getProfileCursorProps(profile, resolveMediaUrl);
  const customColorVars = getCustomColorVars(profile);
  const wrapperStyle = { ...cursorStyle, ...customColorVars };
  const hasVisualBackground = customBgType === "image" || customBgType === "video" || !!builtInBg;
  const needsUnlock = (customBgType === "video") || !!backgroundAudioUrl;
  const pageTheme = profile.pageTheme ?? "classic-dark";
  const isLightTheme = pageTheme === "minimalist-light" || pageTheme === "classic-light";

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

  useEffect(() => {
    if (!backgroundAudioUrl) return;
    const handler = (e: Event) => {
      const audio = audioRef.current;
      if (!audio) return;
      const playing = (e as CustomEvent<{ playing: boolean }>).detail?.playing;
      if (playing) {
        fadeAudio(audio, 0, () => audio.pause());
      } else if (playing === false && unlocked && audio.paused) {
        audio.volume = 0;
        audio.play().catch(() => {});
        fadeAudio(audio, 1);
      }
    };
    window.addEventListener("dread:profile-audio-playing", handler as EventListener);
    return () => window.removeEventListener("dread:profile-audio-playing", handler as EventListener);
  }, [backgroundAudioUrl, unlocked]);

  const content = (
    <div className="relative z-10 w-full min-h-0 flex-1 flex flex-col items-center justify-center py-6">
      {children}
    </div>
  );

  const unlockOverlayLabel = profile.unlockOverlayText?.trim() || "Click here to view profile";
  const showOverlay = (needsUnlock && !unlocked) || testOverlayVisible;
  const handleOverlayClick = useCallback(() => {
    if (testOverlayVisible) {
      onTestOverlayDismissed?.();
    } else {
      handleUnlock();
    }
  }, [testOverlayVisible, onTestOverlayDismissed, handleUnlock]);
  const unlockOverlay = showOverlay && (
    <button
      type="button"
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset ${isLightTheme ? "bg-white/70 hover:bg-white/60" : "bg-black/60 hover:bg-black/50"}`}
      aria-label="Click to view profile and play media"
    >
      <span className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface)]/95 px-7 py-4 text-lg font-medium text-[var(--foreground)] shadow-xl transition-all duration-200 hover:border-[var(--accent)]/70 hover:bg-[var(--surface)]">
        {unlockOverlayLabel}
      </span>
    </button>
  );

  /** Themed vignette + gradient overlay on image/video backgrounds for better legibility and cohesion. */
  const themedOverlay = (customBgType === "image" || customBgType === "video") && (
    <div
      className="pointer-events-none fixed inset-0 z-[1]"
      aria-hidden
      style={
        isLightTheme
          ? {
              background: `
                radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(250,250,250,0.6) 70%, rgba(250,250,250,0.92) 100%),
                linear-gradient(180deg, rgba(250,250,250,0.4) 0%, transparent 30%, transparent 70%, rgba(250,250,250,0.5) 100%)
              `,
            }
          : {
              background: `
                radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(8,9,10,0.5) 70%, rgba(8,9,10,0.85) 100%),
                linear-gradient(180deg, rgba(8,9,10,0.3) 0%, transparent 25%, transparent 75%, rgba(8,9,10,0.4) 100%)
              `,
            }
      }
    />
  );

  const hasCustomCursor = Boolean(cursorClass || cursorStyle?.cursor);
  const hasCustomBg = Boolean(profile.customBackgroundColor?.trim() && /^#[0-9a-fA-F]{6}$/.test(profile.customBackgroundColor.trim()));
  const wrapperClassName = [
    "min-h-screen flex flex-col",
    themeClass,
    cursorClass,
    hasCustomCursor && "profile-cursor-active",
    hasCustomBg && "profile-custom-bg",
  ]
    .filter(Boolean)
    .join(" ");

  if (builtInBg) {
    const bgClass =
      builtInBg === "grid"
        ? "profile-bg-grid"
        : builtInBg === "gradient"
          ? "profile-bg-gradient"
          : "profile-bg-dither";
    return (
      <div className={wrapperClassName} style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined} data-page-theme={pageTheme}>
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
      <div className={wrapperClassName} style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined} data-page-theme={pageTheme}>
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
      <div className={wrapperClassName} style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined} data-page-theme={pageTheme}>
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
      <div className={wrapperClassName} style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined} data-page-theme={pageTheme}>
        <audio ref={audioRef} src={resolvedUrl} loop preload="metadata" className="sr-only" aria-hidden />
        {unlockOverlay}
        {content}
      </div>
    );
  }

  return (
    <div className={wrapperClassName} style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined} data-page-theme={pageTheme}>
      {children}
    </div>
  );
}
