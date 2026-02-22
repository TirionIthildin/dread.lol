"use client";

import { useState, useCallback } from "react";
import ProfileMarkdown from "@/app/components/ProfileMarkdown";
import { AnimatedField } from "@/app/components/TypewriterText";

const BAT = "🦇";
const FLY_DURATION_MS = 1200;
const DESC_ANIMATIONS = ["none", "fade-in", "slide-up", "slide-in-left", "blur-in"] as const;

interface ProfileDescriptionProps {
  text: string;
  /** Per-field animation (no typewriter for long description). */
  animation?: string | null;
}

export default function ProfileDescription({ text, animation }: ProfileDescriptionProps) {
  const [revealed, setRevealed] = useState(false);
  const [flying, setFlying] = useState(false);

  const handleBatClick = useCallback(() => {
    setFlying(true);
    setRevealed(true);
    setTimeout(() => setRevealed(false), 2500);
    setTimeout(() => setFlying(false), FLY_DURATION_MS);
  }, []);

  const descAnim = animation && DESC_ANIMATIONS.includes(animation as (typeof DESC_ANIMATIONS)[number]) ? animation : "none";

  const wrapWithAnimation = (inner: React.ReactNode) =>
    descAnim !== "none" ? (
      <AnimatedField animation={descAnim} as="div">
        {inner}
      </AnimatedField>
    ) : (
      inner
    );

  if (!text.includes(BAT)) {
    return wrapWithAnimation(
      <div className="mt-3 pl-3 border-l-2 border-[var(--border)]/60 text-[var(--muted)] leading-relaxed text-sm">
        <ProfileMarkdown content={text} />
      </div>
    );
  }

  // Any bat emoji (🦇) is clickable and triggers the animation
  const parts = text.split(BAT);
  return wrapWithAnimation(
    <div className="mt-3 pl-3 border-l-2 border-[var(--border)]/60 text-[var(--muted)] leading-relaxed text-sm">
      <span className="inline">
        {parts.map((part, i) => (
          <span key={i}>
            {part && <ProfileMarkdown content={part} inline />}
            {i < parts.length - 1 && (
              <button
                type="button"
                onClick={handleBatClick}
                disabled={flying}
                className={`inline-block align-middle transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--surface)] rounded cursor-pointer disabled:pointer-events-none ${flying ? "animate-bat-fly" : ""}`}
                aria-label="Easter egg"
                title="Click me"
              >
                {BAT}
              </button>
            )}
          </span>
        ))}
        {revealed && (
          <span className="ml-2 text-[var(--terminal)] text-xs" role="status">
            I am batman
          </span>
        )}
      </span>
    </div>
  );
}
