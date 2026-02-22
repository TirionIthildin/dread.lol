"use client";

import { useId } from "react";

export const BACKGROUND_EFFECTS = ["snow", "rain", "blur", "retro-computer"] as const;
export type BackgroundEffect = (typeof BACKGROUND_EFFECTS)[number];

interface BackgroundEffectOverlayProps {
  effect: BackgroundEffect;
  isLightTheme?: boolean;
  /** When true, render effect above content (for snow/rain). Default: below content. */
  aboveContent?: boolean;
}

/** Snow: falling snowflakes across the viewport. */
function SnowEffect({ aboveContent }: { aboveContent?: boolean }) {
  const count = 50;
  return (
    <div className={`background-effect-snow fixed inset-0 overflow-hidden pointer-events-none isolate ${aboveContent ? "z-[20]" : "z-[2]"}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 17.3 + 5) % 100;
        const delay = (i * 0.13) % 8;
        const duration = 5 + (i % 4) * 1.5;
        const size = 4 + (i % 6);
        const opacity = 0.5 + (i % 4) * 0.15;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${left}%`,
              top: "-10px",
              width: size,
              height: size,
              opacity,
              animation: `background-effect-snow-fall ${duration}s linear infinite`,
              animationDelay: `-${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Rain: falling rain streaks. */
function RainEffect({ aboveContent }: { aboveContent?: boolean }) {
  const count = 100;
  return (
    <div className={`background-effect-rain fixed inset-0 overflow-hidden pointer-events-none isolate ${aboveContent ? "z-[20]" : "z-[2]"}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 11.7 + 2) % 100;
        const delay = (i * 0.08) % 4;
        const duration = 1 + (i % 4) * 0.25;
        const height = 60 + (i % 4) * 20;
        const opacity = 0.12 + (i % 5) * 0.04;
        return (
          <div
            key={i}
            className="absolute bg-white"
        style={{
          left: `${left}%`,
          top: "-80px",
          width: 2,
          height,
              opacity,
              transform: `rotate(-12deg)`,
              animation: `background-effect-rain-fall ${duration}s linear infinite`,
              animationDelay: `-${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Blur: frosted glass overlay for a soft diffused look. */
function BlurEffect({ isLightTheme }: { isLightTheme?: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[2] pointer-events-none isolate"
      aria-hidden
      style={{
        background: isLightTheme
          ? "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.1) 100%)"
          : "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.25) 100%)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    />
  );
}

/** Retro computer: old terminal CRT aesthetic - phosphor tint, scanlines, noise, curvature. */
function RetroComputerEffect({ isLightTheme }: { isLightTheme?: boolean }) {
  const noiseId = useId();
  return (
    <div className="background-effect-retro fixed inset-0 z-[2] overflow-hidden pointer-events-none isolate" aria-hidden>
      {/* Phosphor tint - matches profile accent color */}
      <div
        className="background-effect-retro-phosphor absolute inset-0 mix-blend-multiply"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 50%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, color-mix(in srgb, var(--accent) 18%, transparent) 100%)",
        }}
      />
      {/* Strong CRT scanlines - animated crawl */}
      <div
        className="background-effect-retro-scanlines absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 1px,
            ${isLightTheme ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.6)"} 1px,
            ${isLightTheme ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.6)"} 3px
          )`,
          opacity: 0.9,
        }}
      />
      {/* Noise / film grain - SVG turbulence */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.25] mix-blend-overlay" aria-hidden>
        <filter id={noiseId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" seed="1" result="t" />
          <feColorMatrix in="t" type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" fill="white" filter={`url(#${noiseId})`} />
      </svg>
      {/* Curved screen edges + vignette - old monitor bezel feel */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, ${isLightTheme ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.6)"} 100%)`,
          borderRadius: "3%",
          boxShadow: isLightTheme
            ? "inset 0 0 100px 30px rgba(0,0,0,0.08)"
            : "inset 0 0 150px 50px rgba(0,0,0,0.25)",
        }}
      />
      {/* Flicker animation */}
      <div
        className="background-effect-crt-flicker absolute inset-0 opacity-0"
        style={{
          background: "rgba(255,255,255,0.02)",
        }}
      />
    </div>
  );
}

export default function BackgroundEffectOverlay({ effect, isLightTheme = false, aboveContent = false }: BackgroundEffectOverlayProps) {
  if (effect === "snow") return <SnowEffect aboveContent={aboveContent} />;
  if (effect === "rain") return <RainEffect aboveContent={aboveContent} />;
  if (effect === "blur") return <BlurEffect isLightTheme={isLightTheme} />;
  if (effect === "retro-computer") return <RetroComputerEffect isLightTheme={isLightTheme} />;
  return null;
}
