"use client";

import { useState, useCallback } from "react";

interface CopyButtonProps {
  copyValue: string;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}

export default function CopyButton({ copyValue, children, ariaLabel, className = "" }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("failed");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [copyValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      title={`Copy: ${copyValue}`}
      className={`inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg border px-3 py-2.5 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] ${status === "copied" ? "border-[var(--terminal)]/40 bg-[var(--terminal)]/10 text-[var(--terminal)]" : status === "failed" ? "border-[var(--warning)]/50 bg-[var(--warning)]/10 text-[var(--warning)]" : "border-[var(--border)] bg-[var(--bg)]/70 text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:shadow-[0_0_14px_rgba(6,182,212,0.12)] active:opacity-90"} ${className}`}
    >
      {children}
      {status === "copied" && (
        <span className="text-xs font-medium animate-fade-in" role="status" aria-live="polite">
          Copied!
        </span>
      )}
      {status === "failed" && (
        <span className="text-xs font-medium animate-fade-in" role="alert">
          Copy failed
        </span>
      )}
    </button>
  );
}
