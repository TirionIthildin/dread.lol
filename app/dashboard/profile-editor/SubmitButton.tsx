"use client";

import { useFormStatus } from "react-dom";
import { FloppyDisk, ArrowCounterClockwise } from "@phosphor-icons/react";

export function SubmitButton({ onRevert }: { onRevert?: () => void }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 pt-6 pb-2 -mb-2 flex items-center gap-3 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)] to-transparent">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/20 px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] disabled:opacity-50 disabled:pointer-events-none"
      >
        <FloppyDisk size={18} weight="regular" />
        {pending ? "Saving…" : "Save changes"}
      </button>
      {onRevert && (
        <button
          type="button"
          onClick={onRevert}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--border)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] disabled:opacity-50 disabled:pointer-events-none"
        >
          <ArrowCounterClockwise size={18} weight="regular" />
          Revert changes
        </button>
      )}
      <span className="text-xs text-[var(--muted)]">⌘/Ctrl+Enter to save</span>
    </div>
  );
}
