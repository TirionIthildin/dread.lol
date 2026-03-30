"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Profile } from "@/lib/profiles";
import { getThemeClass, getProfileCursorProps, getCustomColorVars } from "@/lib/profile-themes";
import BackgroundEffectOverlay, {
  BACKGROUND_EFFECTS,
  type BackgroundEffect,
} from "@/app/components/BackgroundEffects";

const FADE_MS = 350;
const MEDIA_COVER_STYLE = {
  width: "max(100vw, 177.78vh)" as const,
  height: "max(100vh, 56.25vw)" as const,
};

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

const BUILT_IN_BACKGROUNDS = ["grid", "gradient", "dither", "solid"] as const;
const BUILT_IN_CLASS_MAP: Record<(typeof BUILT_IN_BACKGROUNDS)[number], string> = {
  grid: "profile-bg-grid",
  gradient: "profile-bg-gradient",
  solid: "profile-bg-solid",
  dither: "profile-bg-dither",
};

const ABOVE_CONTENT_EFFECTS = ["snow", "rain", "retro-computer"] as const;

function isAboveContentEffect(effect: string): boolean {
  return ABOVE_CONTENT_EFFECTS.includes(effect as (typeof ABOVE_CONTENT_EFFECTS)[number]);
}

interface ProfileBackgroundProps {
  profile: Profile;
  children: React.ReactNode;
  defaultUnlocked?: boolean;
  testOverlayVisible?: boolean;
  onTestOverlayDismissed?: () => void;
  scoped?: boolean;
  staticFrame?: boolean;
  disableCustomCursor?: boolean;
  muteBackgroundAudio?: boolean;
}

export default function ProfileBackground({
  profile,
  children,
  defaultUnlocked = false,
  testOverlayVisible = false,
  onTestOverlayDismissed,
  scoped = false,
  staticFrame = false,
  disableCustomCursor = false,
  muteBackgroundAudio = false,
}: ProfileBackgroundProps) {
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
    if (t === "") return "grid";
    return null;
  })();
  const backgroundUrl = profile.backgroundUrl?.trim();
  const backgroundAudioUrl = profile.backgroundAudioUrl?.trim();
  const backgroundAudioStartSeconds = Math.max(0, Number(profile.backgroundAudioStartSeconds) || 0);

  const themeClass = getThemeClass(profile.accentColor);
  const { cursorClass, cursorStyle } = getProfileCursorProps(profile, resolveMediaUrl);
  const customColorVars = getCustomColorVars(profile);
  const wrapperStyle = { ...cursorStyle, ...customColorVars };
  const needsUnlock = customBgType === "video" || !!backgroundAudioUrl;
  const pageTheme = profile.pageTheme ?? "classic-dark";
  const isLightTheme =
    pageTheme === "minimalist-light" ||
    pageTheme === "classic-light" ||
    pageTheme === "professional-light";
  const backgroundEffect: BackgroundEffect | null =
    profile.backgroundEffect && BACKGROUND_EFFECTS.includes(profile.backgroundEffect as BackgroundEffect)
      ? (profile.backgroundEffect as BackgroundEffect)
      : null;

  const handleUnlock = useCallback(() => {
    if (customBgType === "video" && videoRef.current) {
      videoRef.current.muted = muteBackgroundAudio;
      videoRef.current.play().catch(() => {});
    }
    if (backgroundAudioUrl && audioRef.current && !muteBackgroundAudio) {
      const audio = audioRef.current;
      const startSec = backgroundAudioStartSeconds;
      if (startSec > 0) {
        audio.volume = 0;
        const onPlaying = () => {
          audio.removeEventListener("playing", onPlaying);
          audio.removeEventListener("timeupdate", onTimeUpdate);
          if (audio.currentTime < startSec - 0.5) audio.currentTime = startSec;
          fadeAudio(audio, 1);
        };
        const onTimeUpdate = () => {
          if (audio.currentTime < startSec - 0.5) audio.currentTime = startSec;
          audio.removeEventListener("timeupdate", onTimeUpdate);
        };
        audio.addEventListener("playing", onPlaying);
        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.currentTime = startSec;
        audio.play().catch(() => {
          audio.removeEventListener("playing", onPlaying);
          audio.removeEventListener("timeupdate", onTimeUpdate);
        });
      } else {
        audio.play().catch(() => {});
      }
    }
    setUnlocked(true);
  }, [customBgType, backgroundAudioUrl, muteBackgroundAudio, backgroundAudioStartSeconds]);

  // Coordinate with ProfileAudioPlayer: fade out/pause background when a track plays; resume when track stops
  useEffect(() => {
    if (!backgroundAudioUrl || muteBackgroundAudio) return;
    const handler = (e: Event) => {
      const audio = audioRef.current;
      if (!audio) return;
      const playing = (e as CustomEvent<{ playing: boolean }>).detail?.playing;
      if (playing) {
        fadeAudio(audio, 0, () => audio.pause());
      } else if (playing === false && unlocked && audio.paused) {
        const startSec = backgroundAudioStartSeconds;
        if (startSec > 0) {
          audio.volume = 0;
          const onPlaying = () => {
            audio.removeEventListener("playing", onPlaying);
            audio.removeEventListener("timeupdate", onTimeUpdate);
            if (audio.currentTime < startSec - 0.5) audio.currentTime = startSec;
            fadeAudio(audio, 1);
          };
          const onTimeUpdate = () => {
            if (audio.currentTime < startSec - 0.5) audio.currentTime = startSec;
            audio.removeEventListener("timeupdate", onTimeUpdate);
          };
          audio.addEventListener("playing", onPlaying);
          audio.addEventListener("timeupdate", onTimeUpdate);
          audio.currentTime = startSec;
          audio.play().catch(() => {
            audio.removeEventListener("playing", onPlaying);
            audio.removeEventListener("timeupdate", onTimeUpdate);
          });
        } else {
          audio.volume = 0;
          audio.play().catch(() => {});
          fadeAudio(audio, 1);
        }
      }
    };
    window.addEventListener("dread:profile-audio-playing", handler as EventListener);
    return () => window.removeEventListener("dread:profile-audio-playing", handler as EventListener);
  }, [backgroundAudioUrl, unlocked, muteBackgroundAudio, backgroundAudioStartSeconds]);

  const content = (
    <div
      className={`relative z-10 w-full min-h-0 flex-1 flex flex-col items-center justify-center py-6 ${scoped ? "bg-[var(--bg)]" : ""}`}
    >
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
  const overlayPos = scoped ? "absolute" : "fixed";

  const unlockOverlay = showOverlay && (
    <button
      type="button"
      onClick={handleOverlayClick}
      className={`${overlayPos} inset-0 z-[100] flex items-center justify-center backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset ${isLightTheme ? "bg-white/70 hover:bg-white/60" : "bg-black/60 hover:bg-black/50"}`}
      aria-label="Click to view profile and play media"
    >
      <span className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface)]/95 px-7 py-4 text-lg font-medium text-[var(--foreground)] shadow-xl transition-all duration-200 hover:border-[var(--accent)]/70 hover:bg-[var(--surface)]">
        {unlockOverlayLabel}
      </span>
    </button>
  );

  const themedOverlay = (customBgType === "image" || customBgType === "video") && (
    <div
      className={`pointer-events-none ${overlayPos} inset-0 z-[1]`}
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

  const hasCustomCursor = !disableCustomCursor && Boolean(cursorClass || cursorStyle?.cursor);
  const hasCustomBg = Boolean(
    profile.customBackgroundColor?.trim() && /^#[0-9a-fA-F]{6}$/.test(profile.customBackgroundColor.trim())
  );
  const wrapperClassName = [
    scoped ? "relative flex flex-col min-h-0 flex-1" : "min-h-screen flex flex-col",
    themeClass,
    cursorClass,
    hasCustomCursor && "profile-cursor-active",
    hasCustomBg && "profile-custom-bg",
  ]
    .filter(Boolean)
    .join(" ");

  const effectOverlay =
    backgroundEffect && !staticFrame ? (
      <BackgroundEffectOverlay
        effect={backgroundEffect}
        isLightTheme={isLightTheme}
        aboveContent={isAboveContentEffect(backgroundEffect)}
        scoped={scoped}
      />
    ) : null;

  const audioElement =
    backgroundAudioUrl ? (
      <audio
        ref={audioRef}
        src={resolveMediaUrl(backgroundAudioUrl)}
        loop={backgroundAudioStartSeconds <= 0}
        preload="auto"
        className="sr-only"
        aria-hidden
        onCanPlay={
          backgroundAudioStartSeconds > 0
            ? (e) => {
                const el = e.currentTarget as HTMLAudioElement;
                if (el.currentTime < backgroundAudioStartSeconds - 0.1) el.currentTime = backgroundAudioStartSeconds;
              }
            : undefined
        }
        onEnded={
          backgroundAudioStartSeconds > 0
            ? () => {
                const a = audioRef.current;
                if (a) {
                  a.currentTime = backgroundAudioStartSeconds;
                  a.play().catch(() => {});
                }
              }
            : undefined
        }
      />
    ) : null;

  if (builtInBg) {
    const bgClass = BUILT_IN_CLASS_MAP[builtInBg];
    const bgPos = scoped ? "absolute" : "fixed";
    return (
      <div
        className={wrapperClassName}
        style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
        data-page-theme={pageTheme}
      >
        <div className={`${bgPos} inset-0 z-0 overflow-hidden ${bgClass}`} aria-hidden />
        {effectOverlay}
        {audioElement}
        {unlockOverlay}
        {content}
      </div>
    );
  }

  if (customBgType === "image" && backgroundUrl) {
    const resolvedImageUrl = resolveMediaUrl(backgroundUrl);
    return (
      <div
        className={wrapperClassName}
        style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
        data-page-theme={pageTheme}
      >
        <div className={`${overlayPos} inset-0 z-0 overflow-hidden`} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic /api/files URLs; layout needs object-cover */}
          <img
            src={resolvedImageUrl}
            alt=""
            className="absolute left-1/2 top-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
            style={MEDIA_COVER_STYLE}
          />
        </div>
        {effectOverlay}
        {themedOverlay}
        {audioElement}
        {unlockOverlay}
        {content}
      </div>
    );
  }

  if (customBgType === "video" && backgroundUrl) {
    const resolvedUrl = resolveMediaUrl(backgroundUrl);
    if (!resolvedUrl) return <>{children}</>;

    return (
      <div
        className={wrapperClassName}
        style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
        data-page-theme={pageTheme}
      >
        <div className={`${overlayPos} inset-0 z-0 overflow-hidden`} aria-hidden>
          <video
            ref={videoRef}
            src={resolvedUrl}
            autoPlay={!staticFrame}
            loop={!staticFrame}
            muted={!unlocked || staticFrame}
            playsInline
            preload={staticFrame ? "auto" : "metadata"}
            className="absolute left-1/2 top-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
            style={{ ...MEDIA_COVER_STYLE, opacity: unlocked ? 1 : 0.3 }}
          />
        </div>
        {effectOverlay}
        {themedOverlay}
        {audioElement}
        {unlockOverlay}
        {content}
      </div>
    );
  }

  if (backgroundAudioUrl) {
    const resolvedUrl = resolveMediaUrl(backgroundAudioUrl);
    if (!resolvedUrl) return <>{children}</>;

    return (
      <div
        className={wrapperClassName}
        style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
        data-page-theme={pageTheme}
      >
        {effectOverlay}
        {audioElement}
        {unlockOverlay}
        {content}
      </div>
    );
  }

  return (
    <div
      className={wrapperClassName}
      style={Object.keys(wrapperStyle).length ? wrapperStyle : undefined}
      data-page-theme={pageTheme}
    >
      {effectOverlay}
      {content}
    </div>
  );
}
