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

const BARS = 32;
const ACCENT = "#06b6d4";

type VisualizerStyle = "bars" | "wave" | "spectrum";

interface ProfileAudioPlayerProps {
  tracks: { url: string; title?: string }[];
  visualizerStyle?: string;
  visualizerAnimation?: string;
}

/** Get normalized bar values (0–1) from frequency data. Linear bands, per-frame normalized. */
function getNormalizedBands(freqData: Uint8Array, count: number): number[] {
  const bins = freqData.length;
  const step = bins / count;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * step);
    const end = Math.min(Math.floor((i + 1) * step), bins);
    let sum = 0;
    for (let j = start; j < end; j++) sum += freqData[j] ?? 0;
    out.push((end > start ? sum / (end - start) : 0) / 255);
  }
  const max = Math.max(...out, 0.05);
  return out.map((v) => Math.min(1, v / max));
}

export default function ProfileAudioPlayer({
  tracks,
  visualizerStyle,
}: ProfileAudioPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef<number[]>([]);
  const currentTrack = tracks[currentIndex];
  const resolvedUrl = currentTrack ? resolveMediaUrl(currentTrack.url) : "";
  const style: VisualizerStyle | null = ["bars", "wave", "spectrum"].includes(visualizerStyle ?? "")
    ? (visualizerStyle as VisualizerStyle)
    : ["waveform", "circle", "line", "blocks"].includes(visualizerStyle ?? "")
      ? "bars"
      : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (currentIndex < tracks.length - 1) setCurrentIndex((i) => i + 1);
      else setPlaying(false);
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
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing, resolvedUrl]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("dread:profile-audio-playing", { detail: { playing } }));
  }, [playing]);

  useEffect(() => {
    if (!style) return;
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    if (!playing) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx =
      ctxRef.current ??
      new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (!ctxRef.current) ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const analyser = analyserRef.current ?? ctx.createAnalyser();
    if (!analyserRef.current) {
      analyserRef.current = analyser;
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      analyser.minDecibels = -70;
      analyser.maxDecibels = -5;
    }

    if (!sourceRef.current) {
      const src = ctx.createMediaElementSource(audio);
      sourceRef.current = src;
      src.connect(analyser);
      analyser.connect(ctx.destination);
    }

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.fftSize);

    const dpr = Math.min(2, window.devicePixelRatio ?? 1);
    let cw = 0;
    let ch = 0;
    const g = canvas.getContext("2d");
    if (!g) return;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      if (rect.width !== cw || rect.height !== ch) {
        cw = rect.width * dpr;
        ch = rect.height * dpr;
        canvas.width = cw;
        canvas.height = ch;
      }
      g.clearRect(0, 0, cw, ch);
      const cy = ch / 2;

      if (style === "bars") {
        analyser.getByteFrequencyData(freqData as Uint8Array<ArrayBuffer>);
        const bands = getNormalizedBands(freqData, BARS);
        const prev = prevRef.current;
        while (prev.length < BARS) prev.push(0);
        const w = cw / BARS;
        const barW = Math.max(2, w * 0.6);
        const gap = (w - barW) / 2;
        const maxH = ch * 0.45;

        for (let i = 0; i < BARS; i++) {
          const target = bands[i];
          const v = lerp(prev[i], target, 0.2);
          prev[i] = v;
          const h = v * maxH;

          const gradient = g.createLinearGradient(0, cy - h, 0, cy + h);
          gradient.addColorStop(0, `rgba(6, 182, 212, 0.15)`);
          gradient.addColorStop(0.5, `rgba(6, 182, 212, 0.5)`);
          gradient.addColorStop(1, `rgba(6, 182, 212, 0.15)`);

          g.fillStyle = gradient;
          const x = i * w + gap;
          g.beginPath();
          g.roundRect(x, cy - h, barW, h * 2, 2);
          g.fill();
        }
      } else if (style === "wave") {
        analyser.getByteTimeDomainData(timeData as Uint8Array<ArrayBuffer>);
        const len = timeData.length;
        g.strokeStyle = ACCENT;
        g.lineWidth = 2;
        g.lineCap = "round";
        g.lineJoin = "round";
        g.globalAlpha = 0.7;
        g.beginPath();
        for (let i = 0; i < len; i++) {
          const v = (timeData[i] ?? 128) / 128 - 1;
          const x = (i / len) * cw;
          const y = cy + v * (ch * 0.35);
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke();
        g.globalAlpha = 1;
      } else if (style === "spectrum") {
        analyser.getByteFrequencyData(freqData as Uint8Array<ArrayBuffer>);
        const bands = getNormalizedBands(freqData, 64);
        const prev = prevRef.current;
        while (prev.length < 64) prev.push(0);
        const step = cw / 64;
        const maxH = ch * 0.45;

        g.beginPath();
        g.moveTo(0, cy);
        for (let i = 0; i < 64; i++) {
          const v = lerp(prev[i], bands[i], 0.2);
          prev[i] = v;
          const x = i * step + step / 2;
          g.lineTo(x, cy - v * maxH);
        }
        g.lineTo(cw, cy);
        for (let i = 63; i >= 0; i--) {
          const v = prev[i];
          const x = i * step + step / 2;
          g.lineTo(x, cy + v * maxH);
        }
        g.closePath();
        g.fillStyle = `rgba(6, 182, 212, 0.2)`;
        g.fill();
        g.strokeStyle = `rgba(6, 182, 212, 0.5)`;
        g.lineWidth = 1;
        g.stroke();
      }
    };
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [style, playing]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

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
    if (currentTime > 2 && audioRef.current) {
      audioRef.current.currentTime = 0;
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
          {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="ml-0.5" />}
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
      {style && (
        <div className="mt-2 h-14 w-full rounded-lg overflow-hidden bg-[var(--bg)]/50">
          <canvas ref={canvasRef} className="w-full h-full block" aria-hidden />
        </div>
      )}
    </div>
  );
}
