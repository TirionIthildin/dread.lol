"use client";

import type { RefObject } from "react";
import NextImage from "next/image";
import { DiscordLogo, UploadSimple } from "@phosphor-icons/react";
import SearchableSelect from "@/app/components/SearchableSelect";
import type { ProfileRow } from "@/lib/db/schema";
import { SLUG_MAX_LENGTH } from "@/lib/slug";
import { TAGLINE_MAX, DESCRIPTION_MAX } from "@/app/dashboard/profile-editor/constants";

export interface BasicsSectionProps {
  visible: boolean;
  profile: ProfileRow;
  slugValue: string;
  setSlugValue: (v: string) => void;
  slugCheck: "idle" | "checking" | "available" | "taken";
  setSlugCheck: (v: "idle" | "checking" | "available" | "taken") => void;
  debouncedCheckSlug: () => void;
  taglineValue: string;
  setTaglineValue: (v: string) => void;
  descriptionValue: string;
  setDescriptionValue: (v: string) => void;
  avatarUrlValue: string;
  setAvatarUrlValue: (v: string) => void;
  discordAvatarUrl?: string | null;
  avatarUploading: boolean;
  setAvatarUploading: (v: boolean) => void;
  avatarUploadError: string | null;
  setAvatarUploadError: (v: string | null) => void;
  avatarFileInputRef: RefObject<HTMLInputElement | null>;
}

export function BasicsSection({ visible, profile, slugValue, setSlugValue, slugCheck, setSlugCheck, debouncedCheckSlug, taglineValue, setTaglineValue, descriptionValue, setDescriptionValue, avatarUrlValue, setAvatarUrlValue, discordAvatarUrl, avatarUploading, setAvatarUploading, avatarUploadError, setAvatarUploadError, avatarFileInputRef }: BasicsSectionProps) {
  return (
    <div className={visible ? "block space-y-6" : "hidden"}>
      {/* Profile URL & name */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">Profile URL & name</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[var(--muted)]">
            Slug (URL path)
            <input
              type="text"
              name="slug"
              value={slugValue}
              onChange={(e) => { setSlugValue(e.target.value.slice(0, SLUG_MAX_LENGTH)); setSlugCheck("idle"); }}
              onBlur={debouncedCheckSlug}
              className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              pattern="[-a-z0-9_]+"
              title="Letters, numbers, hyphen, underscore only"
              maxLength={SLUG_MAX_LENGTH}
            />
            <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
              {slugValue.length} / {SLUG_MAX_LENGTH}
              {slugCheck === "checking" && " · Checking…"}
              {slugCheck === "available" && slugValue.trim() && (
                <span className="text-[var(--terminal)]"> · Available</span>
              )}
              {slugCheck === "taken" && (
                <span className="text-[var(--warning)]"> · This slug is taken</span>
              )}
            </span>
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            Display name
            <input
              type="text"
              name="name"
              defaultValue={profile.name}
              maxLength={100}
              className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </label>
        </div>
      </div>
    
      {/* Avatar */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">Avatar</p>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {(avatarUrlValue === "discord" ? discordAvatarUrl : avatarUrlValue) && (
              <NextImage
                src={avatarUrlValue === "discord" ? (discordAvatarUrl ?? "") : avatarUrlValue}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full border border-[var(--border)] object-cover bg-[var(--bg)]"
                onError={(e) => (e.currentTarget.style.display = "none")}
                unoptimized
              />
            )}
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="sr-only"
              aria-hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  setAvatarUploadError("Avatar must be 5 MB or smaller");
                  e.target.value = "";
                  return;
                }
                setAvatarUploadError(null);
                setAvatarUploading(true);
                try {
                  const form = new FormData();
                  form.append("file", file);
                  form.append("purpose", "avatar");
                  const res = await fetch("/api/upload", { method: "POST", body: form });
                  const data = await res.json();
                  if (!res.ok) {
                    setAvatarUploadError(data.error ?? "Upload failed");
                    return;
                  }
                  const base = typeof window !== "undefined" ? window.location.origin : "";
                  setAvatarUrlValue(data.url?.startsWith("http") ? data.url : `${base}${data.url || ""}`);
                } finally {
                  setAvatarUploading(false);
                  e.target.value = "";
                }
              }}
            />
            <input type="hidden" name="avatarUrl" value={avatarUrlValue} />
            <button
              type="button"
              onClick={() => avatarFileInputRef.current?.click()}
              disabled={avatarUploading}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
            >
              <UploadSimple size={16} weight="regular" />
              {avatarUploading ? "Uploading…" : "Upload"}
            </button>
            {discordAvatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrlValue("discord")}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[#5865F2]/50 hover:text-[#5865F2] transition-colors"
              >
                <DiscordLogo size={16} weight="fill" />
                Use Discord avatar
              </button>
            )}
          </div>
          {avatarUploadError && (
            <p className="text-xs text-[var(--warning)]">{avatarUploadError}</p>
          )}
        </div>
      </div>
    
      {/* Tagline & description */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">About you</p>
        <div className="space-y-4">
          <label className="block text-xs font-medium text-[var(--muted)]">
            Tagline
            <input
              type="text"
              name="tagline"
              value={taglineValue}
              onChange={(e) => setTaglineValue(e.target.value.slice(0, TAGLINE_MAX))}
              placeholder="Optional"
              maxLength={TAGLINE_MAX}
              className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <span className="mt-0.5 block text-[10px] text-[var(--muted)]">{taglineValue.length} / {TAGLINE_MAX}</span>
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            Description <span className="text-[var(--muted)]/70">(Markdown: **bold**, [links](url))</span>
            <textarea
              name="description"
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value.slice(0, DESCRIPTION_MAX))}
              rows={3}
              maxLength={DESCRIPTION_MAX}
              className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <span className="mt-0.5 block text-[10px] text-[var(--muted)]">{descriptionValue.length} / {DESCRIPTION_MAX}</span>
          </label>
        </div>
      </div>
    
      {/* Location & birthday */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">Details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[var(--muted)]">
            Location <span className="text-[var(--muted)]/70">(e.g. NYC, Berlin)</span>
            <input
              type="text"
              name="location"
              defaultValue={(profile as { location?: string }).location ?? ""}
              placeholder="Optional"
              maxLength={80}
              className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            Birthday <span className="text-[var(--muted)]/70">(countdown on profile)</span>
            <div className="mt-1 flex gap-2">
              <div className="flex-1">
                <SearchableSelect
                  name="birthdayMonth"
                  defaultValue={(() => {
                    const b = (profile as { birthday?: string }).birthday;
                    if (!b || !/^\d{2}-\d{2}$/.test(b)) return "";
                    return b.slice(0, 2);
                  })()}
                  options={[
                    { value: "", label: "Month" },
                    ...Array.from({ length: 12 }, (_, i) => {
                      const mm = String(i + 1).padStart(2, "0");
                      const monthName = new Date(2000, i, 1).toLocaleString("default", { month: "long" });
                      return { value: mm, label: monthName };
                    }),
                  ]}
                  searchPlaceholder="Search month…"
                />
              </div>
              <div className="flex-1">
                <SearchableSelect
                  name="birthdayDay"
                  defaultValue={(() => {
                    const b = (profile as { birthday?: string }).birthday;
                    if (!b || !/^\d{2}-\d{2}$/.test(b)) return "";
                    return b.slice(3, 5);
                  })()}
                  options={[
                    { value: "", label: "Day" },
                    ...Array.from({ length: 31 }, (_, i) => ({
                      value: String(i + 1).padStart(2, "0"),
                      label: String(i + 1),
                    })),
                  ]}
                  searchPlaceholder="Search day…"
                />
              </div>
            </div>
          </label>
        </div>
      </div>
      {/* Display options */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">Display</p>
        <div className="space-y-2 rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/30 px-3 py-2">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--foreground)]">
        <input type="checkbox" name="showPageViews" defaultChecked={profile.showPageViews ?? true} className="rounded border-[var(--border)]" />
        Display page views <span className="text-[var(--muted)]/70">(on profile and in dashboard analytics)</span>
      </label>
        </div>
      </div>
    </div>
  );
}
