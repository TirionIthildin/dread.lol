"use client";

import { useState, useCallback } from "react";
import ProfileMarkdown from "@/app/components/ProfileMarkdown";

const BAT = "🦇";
const FLY_DURATION_MS = 1200;

interface ProfileDescriptionProps {
  text: string;
}

export default function ProfileDescription({ text }: ProfileDescriptionProps) {
  const [revealed, setRevealed] = useState(false);
  const [flying, setFlying] = useState(false);

  const handleBatClick = useCallback(() => {
    setFlying(true);
    setRevealed(true);
    setTimeout(() => setRevealed(false), 2500);
    setTimeout(() => setFlying(false), FLY_DURATION_MS);
  }, []);

  if (!text.includes(BAT)) {
    return (
      <div className="mt-3 pl-3 border-l-2 border-[var(--border)]/60 text-[var(--muted)] leading-relaxed text-sm">
        <ProfileMarkdown content={text} />
      </div>
    );
  }

  // Any bat emoji (🦇) is clickable and triggers the animation
  const parts = text.split(BAT);
  return (
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
