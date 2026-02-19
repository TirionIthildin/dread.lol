"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack } from "@phosphor-icons/react";
import { SITE_URL } from "@/lib/site";

function resolveMediaUrl(url: string): string {
  if (!url?.trim()) return "";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${SITE_URL.replace(/\/$/, "")}${u}`;
  return u;
}

interface ProfileAudioPlayerProps {
  tracks: { url: string; title?: string }[];
}

export default function ProfileAudioPlayer({ tracks }: ProfileAudioPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = tracks[currentIndex];
  const resolvedUrl = currentTrack ? resolveMediaUrl(currentTrack.url) : "";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (currentIndex < tracks.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setPlaying(false);
        setCurrentTime(0);
      }
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [currentIndex, tracks.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing, resolvedUrl]);

  if (!tracks.length || !currentTrack) return null;

  const togglePlay = () => setPlaying((p) => !p);
  const goNext = () => {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex((i) => i + 1);
      setCurrentTime(0);
      setPlaying(true);
    }
  };
  const goPrev = () => {
    if (currentTime > 2) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setCurrentTime(0);
      setPlaying(true);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 p-3">
      <audio ref={audioRef} src={resolvedUrl} preload="metadata" />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0 && currentTime < 2}
          className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
          aria-label="Previous track"
        >
          <SkipBack size={20} weight="fill" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-colors"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause size={20} weight="fill" />
          ) : (
            <Play size={20} weight="fill" className="ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={currentIndex === tracks.length - 1}
          className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
          aria-label="Next track"
        >
          <SkipForward size={20} weight="fill" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {currentTrack.title || `Track ${currentIndex + 1}`}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {currentIndex + 1} / {tracks.length}
          </p>
        </div>
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full bg-[var(--accent)]/60 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
