"use client";

import Link from "next/link";
import SearchableSelect from "@/app/components/SearchableSelect";
import type { ProfileRow } from "@/lib/db/schema";
import { TIMEZONE_SELECT_GROUPS } from "@/app/[locale]/dashboard/profile-editor/constants";

export interface ExtrasSectionProps {
  visible: boolean;
  profile: ProfileRow;
  hasPremiumAccess: boolean;
  cardEffectTilt: boolean;
  setCardEffectTilt: (v: boolean) => void;
  cardEffectSpotlight: boolean;
  setCardEffectSpotlight: (v: boolean) => void;
  cardEffectGlare: boolean;
  setCardEffectGlare: (v: boolean) => void;
  cardEffectMagneticBorder: boolean;
  setCardEffectMagneticBorder: (v: boolean) => void;
}

export function ExtrasSection({ visible, profile, hasPremiumAccess, cardEffectTilt, setCardEffectTilt, cardEffectSpotlight, setCardEffectSpotlight, cardEffectGlare, setCardEffectGlare, cardEffectMagneticBorder, setCardEffectMagneticBorder }: ExtrasSectionProps) {
  return (
    <div className={visible ? "block space-y-4" : "hidden"}>
      <p className="text-xs font-medium text-[var(--muted)]">Quote, pronouns, tags, skills, availability, commissions, languages, and time info</p>
      <label className="block text-xs font-medium text-[var(--muted)]">
        Pronouns <span className="text-[var(--muted)]/70">(e.g. they/them)</span>
        <input
          type="text"
          name="pronouns"
          defaultValue={(profile as { pronouns?: string }).pronouns ?? ""}
          placeholder="Optional"
          maxLength={40}
          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </label>
      <label className="block text-xs font-medium text-[var(--muted)]">
        Quote <span className="text-[var(--muted)]/70">(Markdown ok)</span>
        <input
          type="text"
          name="quote"
          defaultValue={profile.quote ?? ""}
          placeholder="Optional"
          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </label>
      <label className="block text-xs font-medium text-[var(--muted)]">
        Tags <span className="text-[var(--muted)]/70">(comma-separated)</span>
        <input
          type="text"
          name="tags"
          defaultValue={profile.tags?.join(", ") ?? ""}
          placeholder="Vibe Coder, LOTR"
          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </label>
      <label className="block text-xs font-medium text-[var(--muted)]">
        Skills / roles <span className="text-[var(--muted)]/70">(comma-separated, e.g. Frontend, Design, 3D)</span>
        <input
          type="text"
          name="skills"
          defaultValue={(profile as { skills?: string[] }).skills?.join(", ") ?? ""}
          placeholder="Frontend, Design, 3D"
          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </label>
      <label className="block text-xs font-medium text-[var(--muted)]">
        Availability
        <div className="mt-1">
          <SearchableSelect
            name="availability"
            defaultValue={(profile as { availability?: string }).availability ?? ""}
            options={[
              { value: "", label: "None" },
              { value: "Open to work", label: "Open to work" },
              { value: "Open to collab", label: "Open to collab" },
              { value: "Just vibing", label: "Just vibing" },
              { value: "Busy", label: "Busy" },
              { value: "Away", label: "Away" },
            ]}
            searchThreshold={10}
          />
        </div>
      </label>
      {hasPremiumAccess ? (
        <>
          <label className="block text-xs font-medium text-[var(--muted)]">
            Commissions <span className="text-[var(--muted)]/70">(status badge on profile)</span>
            <div className="mt-1">
              <SearchableSelect
                name="commissionStatus"
                defaultValue={(profile as { commissionStatus?: string }).commissionStatus ?? ""}
                options={[
                  { value: "", label: "None" },
                  { value: "open", label: "Open" },
                  { value: "closed", label: "Closed" },
                  { value: "waitlist", label: "Waitlist" },
                ]}
                searchThreshold={10}
              />
            </div>
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            Commission price range <span className="text-[var(--muted)]/70">(optional)</span>
            <input
              type="text"
              name="commissionPriceRange"
              defaultValue={(profile as { commissionPriceRange?: string }).commissionPriceRange ?? ""}
              placeholder="e.g. From $50 or $50–200"
              maxLength={80}
              className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </label>
        </>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 px-3 py-2.5 text-xs text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">Commissions &amp; tip links</span> —{" "}
          <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">
            Premium
          </Link>{" "}
          unlocks commission status and Ko-fi / Throne / Amazon wishlist link buttons.
        </div>
      )}
      <label className="block text-xs font-medium text-[var(--muted)]">
        Current focus <span className="text-[var(--muted)]/70">(manual status, e.g. &quot;Working on X&quot;, &quot;Taking a break&quot;)</span>
        <input
          type="text"
          name="currentFocus"
          defaultValue={(profile as { currentFocus?: string }).currentFocus ?? ""}
          placeholder="Optional"
          maxLength={120}
          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </label>
      <div className="space-y-2 rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/30 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Card hover effects</p>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            name="cardEffectTilt"
            checked={cardEffectTilt}
            onChange={(e) => setCardEffectTilt(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          3D tilt <span className="text-[var(--muted)]/70">(extra padding reduces edge clipping)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            name="cardEffectSpotlight"
            checked={cardEffectSpotlight}
            onChange={(e) => setCardEffectSpotlight(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Spotlight <span className="text-[var(--muted)]/70">(accent glow follows cursor)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            name="cardEffectGlare"
            checked={cardEffectGlare}
            onChange={(e) => setCardEffectGlare(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Glare <span className="text-[var(--muted)]/70">(glossy highlight + shine sweep)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            name="cardEffectMagneticBorder"
            checked={cardEffectMagneticBorder}
            onChange={(e) => setCardEffectMagneticBorder(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Accent border <span className="text-[var(--muted)]/70">(animated edge highlight)</span>
        </label>
      </div>
      <label className="block text-xs font-medium text-[var(--muted)]">
        Languages <span className="text-[var(--muted)]/70">(e.g. EN, ES, FR)</span>
        <input
          type="text"
          name="languages"
          defaultValue={(profile as { languages?: string }).languages ?? ""}
          placeholder="Optional"
          maxLength={80}
          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </label>
      <label className="block text-xs font-medium text-[var(--muted)]">
        Local time <span className="text-[var(--muted)]/70">(timezone — your current time is shown on profile)</span>
        <div className="mt-1">
          <SearchableSelect
            name="timezone"
            defaultValue={(profile as { timezone?: string }).timezone ?? ""}
            groups={[
              { label: "", options: [{ value: "", label: "None" }] },
              ...TIMEZONE_SELECT_GROUPS,
            ]}
            placeholder="None"
            searchPlaceholder="Search timezone…"
            ariaLabel="Timezone"
          />
        </div>
      </label>
      <label className="block text-xs font-medium text-[var(--muted)]">
        When you&apos;re usually online <span className="text-[var(--muted)]/70">(e.g. Usually 6pm–12am EST)</span>
        <input
          type="text"
          name="timezoneRange"
          defaultValue={(profile as { timezoneRange?: string }).timezoneRange ?? ""}
          placeholder="Optional"
          maxLength={120}
          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </label>
    </div>
  );
}
