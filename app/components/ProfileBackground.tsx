"use client";

import { useState, useCallback } from "react";
import type { Profile } from "@/lib/profiles";

/** Extract YouTube video ID from various URL formats. */
function getYoutubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = u.match(p);
    if (m) return m[1];
  }
  return null;
}

interface ProfileBackgroundProps {
  profile: Profile;
  children: React.ReactNode;
}

export default function ProfileBackground({ profile, children }: ProfileBackgroundProps) {
  const [youtubeUnlocked, setYoutubeUnlocked] = useState(false);
  const backgroundType = profile.backgroundType === "image" || profile.backgroundType === "youtube" ? profile.backgroundType : null;
  const backgroundUrl = profile.backgroundUrl?.trim();

  const handleUnlockYoutube = useCallback(() => {
    setYoutubeUnlocked(true);
  }, []);

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
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10">{children}</div>
      </>
    );
  }

  if (backgroundType === "youtube") {
    const videoId = getYoutubeVideoId(backgroundUrl);
    if (!videoId) return <>{children}</>;

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1`;
    const posterUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return (
      <>
        <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
          {youtubeUnlocked ? (
            <iframe
              src={embedUrl}
              title="Background video"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: "max(100vw, 177.78vh)",
                height: "max(100vh, 56.25vw)",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${posterUrl})` }}
            />
          )}
        </div>
        {!youtubeUnlocked && (
          <button
            type="button"
            onClick={handleUnlockYoutube}
            className="fixed inset-0 z-[5] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity hover:bg-black/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset"
            aria-label="Click to view profile and play background video"
          >
            <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 px-6 py-4 text-lg font-medium text-[var(--foreground)] shadow-xl transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface)]">
              Click here to view profile
            </span>
          </button>
        )}
        <div className="relative z-10">{children}</div>
      </>
    );
  }

  return <>{children}</>;
}
