"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Flag } from "@phosphor-icons/react";

interface ProfileReportButtonProps {
  slug: string;
  /** If false, show "Sign in to report" when clicked */
  canSubmit?: boolean;
}

const MAX_REASON_LENGTH = 1000;

export default function ProfileReportButton({ slug, canSubmit = true }: ProfileReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(slug)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
          setReason("");
        }, 1500);
      } else {
        alert(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      alert("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]/80 transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--border)]"
        title={canSubmit ? "Report this profile" : "Sign in to report"}
        aria-label="Report this profile"
      >
        <Flag size={12} weight="regular" aria-hidden />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && setOpen(false)}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="report-dialog-title" className="text-base font-semibold text-[var(--foreground)]">
          Report profile
        </h3>
        {!canSubmit ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Please sign in to report this profile.
          </p>
        ) : submitted ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Thank you. We&apos;ll look into this report.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Please describe why you&apos;re reporting this profile (optional but helpful).
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
              placeholder="e.g. Spam, impersonation, offensive content..."
              rows={4}
              className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              maxLength={MAX_REASON_LENGTH}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              {reason.length}/{MAX_REASON_LENGTH} characters
            </p>
            <div className="mt-4 flex justify-end gap-2">
              {!canSubmit ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <Link
                    href="/dashboard"
                    className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20"
                  >
                    Sign in
                  </Link>
                </>
              ) : (
                <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-[var(--warning)]/20 disabled:opacity-50"
              >
                {loading ? "…" : "Submit report"}
              </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
