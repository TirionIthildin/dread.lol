"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, X } from "@phosphor-icons/react";
import type { ProfileRow } from "@/lib/db/schema";

const STORAGE_KEY = "dread.profileEditor.onboardingDismissed.v1";

function parseLinkCount(profile: ProfileRow): number {
  const raw = profile.links;
  if (!raw || typeof raw !== "string") return 0;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function ProfileEditorOnboarding({
  profile,
  slugDraft,
}: {
  profile: ProfileRow;
  slugDraft: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  const hidden = useMemo(() => {
    if (dismissed) return true;
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }, [dismissed]);

  const slugOk = (slugDraft ?? profile.slug ?? "").trim().length >= 2;
  const linksOk = parseLinkCount(profile) > 0;
  const themeOk = Boolean(
    profile.accentColor ||
      ((profile as { pageTheme?: string }).pageTheme &&
        (profile as { pageTheme?: string }).pageTheme !== "classic-dark")
  );

  const allDone = slugOk && linksOk && themeOk;

  if (hidden || allDone) return null;

  return (
    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3 mb-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--foreground)]">Get started</p>
        <button
          type="button"
          className="shrink-0 p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--muted)]"
          aria-label="Dismiss checklist"
          onClick={() => {
            try {
              window.localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
        >
          <X size={18} weight="bold" />
        </button>
      </div>
      <ol className="space-y-1.5 text-xs text-[var(--muted)]">
        <li className="flex items-center gap-2">
          {slugOk ? (
            <CheckCircle size={16} weight="fill" className="text-[var(--terminal)] shrink-0" aria-hidden />
          ) : (
            <span className="w-4 h-4 rounded-full border border-[var(--border)] shrink-0" aria-hidden />
          )}
          <span>Set your profile slug under Basics.</span>
        </li>
        <li className="flex items-center gap-2">
          {linksOk ? (
            <CheckCircle size={16} weight="fill" className="text-[var(--terminal)] shrink-0" aria-hidden />
          ) : (
            <span className="w-4 h-4 rounded-full border border-[var(--border)] shrink-0" aria-hidden />
          )}
          <span>
            Add links in the{" "}
            <Link href="/dashboard?section=links" className="text-[var(--accent)] hover:underline">
              Links
            </Link>{" "}
            tab.
          </span>
        </li>
        <li className="flex items-center gap-2">
          {themeOk ? (
            <CheckCircle size={16} weight="fill" className="text-[var(--terminal)] shrink-0" aria-hidden />
          ) : (
            <span className="w-4 h-4 rounded-full border border-[var(--border)] shrink-0" aria-hidden />
          )}
          <span>Pick a theme or accent in Styling.</span>
        </li>
      </ol>
    </div>
  );
}
