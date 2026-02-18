"use client";

import { useState, useCallback } from "react";

const BAT = "🦇";
const FLY_DURATION_MS = 1200;

interface ProfileDescriptionProps {
  text: string;
  /** When set, the bat emoji in the text becomes clickable and shows an easter egg. */
  easterEgg?: boolean;
}

export default function ProfileDescription({ text, easterEgg }: ProfileDescriptionProps) {
  const [revealed, setRevealed] = useState(false);
  const [flying, setFlying] = useState(false);

  const handleBatClick = useCallback(() => {
    setFlying(true);
    setRevealed(true);
    setTimeout(() => setRevealed(false), 2500);
    setTimeout(() => setFlying(false), FLY_DURATION_MS);
  }, []);

  if (!easterEgg || !text.includes(BAT)) {
    return (
      <div className="mt-3 pl-3 border-l-2 border-[var(--border)]/60">
        <p className="text-[var(--muted)] leading-relaxed text-sm">{text}</p>
      </div>
    );
  }

  const parts = text.split(BAT);
  return (
    <div className="mt-3 pl-3 border-l-2 border-[var(--border)]/60">
      <p className="text-[var(--muted)] leading-relaxed text-sm">
        {parts[0]}
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
        {parts[1]}
        {revealed && (
          <span className="ml-2 text-[var(--terminal)] text-xs" role="status">
            I am batman
          </span>
        )}
      </p>
    </div>
  );
}
