"use client";

import SearchableSelect from "@/app/components/SearchableSelect";
import type { ProfileRow } from "@/lib/db/schema";
import { BANNER_STYLE_OPTIONS } from "@/lib/profile-themes";

export interface BannerSectionProps {
  visible: boolean;
  profile: ProfileRow;
  bannerValue: string;
  setBannerValue: (v: string) => void;
}

export function BannerSection({ visible, profile, bannerValue, setBannerValue }: BannerSectionProps) {
  return (
    <div
      className={
        visible
          ? "flex min-h-[min(70vh,800px)] flex-col gap-3"
          : "hidden"
      }
    >
      <p className="text-xs font-medium text-[var(--muted)] shrink-0">Text art and options</p>
      <p className="text-[10px] text-[var(--muted)] shrink-0">
        Create text art:{" "}
        <a
          href="https://patorjk.com/software/taag/#p=display&f=Ghost&t=Tirion&x=none"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          TAAG (e.g. Ghost font)
        </a>
      </p>
      <div className="flex flex-1 min-h-0 gap-2">
        <label className="flex min-h-0 flex-1 min-w-0 flex-col text-xs font-medium text-[var(--muted)]">
          <span className="shrink-0">Text art <span className="text-[var(--muted)]/70">(optional, shown at top of profile)</span></span>
          <textarea
            name="banner"
            value={bannerValue}
            onChange={(e) => setBannerValue(e.target.value)}
            placeholder="Paste ASCII art here…"
            rows={16}
            className="mt-1 min-h-[240px] w-full flex-1 resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm leading-tight text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
          />
        </label>
        <button
          type="button"
          onClick={() => setBannerValue("")}
          className="h-fit shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-4 shrink-0">
        <label className="block text-xs font-medium text-[var(--muted)]">
          Text art gradient
          <div className="mt-1 max-w-xs">
            <SearchableSelect
              name="bannerStyle"
              defaultValue={
                profile.bannerStyle ?? (profile.bannerAnimatedFire ? "fire" : "accent")
              }
              options={BANNER_STYLE_OPTIONS}
              searchPlaceholder="Search…"
            />
          </div>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)] pt-6">
          <input type="checkbox" name="bannerSmall" defaultChecked={profile.bannerSmall ?? false} className="rounded border-[var(--border)]" />
          Smaller font
        </label>
      </div>
    </div>
  );
}
