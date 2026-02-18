"use client";

import { useState, useCallback } from "react";

interface CopyButtonProps {
  copyValue: string;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}

export default function CopyButton({ copyValue, children, ariaLabel, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [copyValue]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      title={`Copy: ${copyValue}`}
      className={`inline-flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2.5 text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:shadow-[0_0_14px_rgba(6,182,212,0.12)] active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] ${className}`}
    >
      {children}
      {copied && (
        <span className="text-xs font-medium text-[var(--terminal)] animate-fade-in" role="status" aria-live="polite">
          Copied!
        </span>
      )}
    </button>
  );
}
