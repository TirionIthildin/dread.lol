"use client";

import { Link } from "@/i18n/navigation";
import { PREMIUM_MONETIZATION_LINK_TYPES } from "@/lib/monetization-profile";
import { useActionState, useState, useEffect, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { Save, Link2 as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import SearchableSelect from "@/app/components/SearchableSelect";
import {
  updateLinksAction,
  type ProfileFormState,
} from "@/app/[locale]/dashboard/actions";
import type { ProfileRow } from "@/lib/db/schema";
import { BADGE_ICON_OPTIONS } from "@/lib/badge-icons";
import {
  LINK_TYPES,
  parseLinkEntries,
  linkEntriesToFormPayload,
  type LinkEntry,
} from "@/lib/link-entries";

interface DashboardLinksProps {
  profile: ProfileRow;
  /** When true, hide the page heading (e.g. embedded layout). */
  embedded?: boolean;
  /** Stable id for keyboard save / programmatic submit from profile editor. */
  formId?: string;
  /** When false, Ko-fi / Throne / Amazon wishlist types are hidden (Premium-only). */
  hasPremiumAccess?: boolean;
  /** Copyable socials toggle (lifted for live preview in profile editor). Omitted on standalone Links page. */
  copyableSocials?: boolean;
  setCopyableSocials?: (v: boolean) => void;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/20 px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] disabled:opacity-50"
    >
      <Save size={18} />
      {pending ? "Saving…" : "Save links"}
    </button>
  );
}

export default function DashboardLinks({
  profile,
  embedded,
  formId,
  hasPremiumAccess = false,
  copyableSocials: copyableSocialsProp,
  setCopyableSocials: setCopyableSocialsProp,
}: DashboardLinksProps) {
  const [linkEntries, setLinkEntries] = useState<LinkEntry[]>(() => parseLinkEntries(profile));
  const [socialLinksGlow, setSocialLinksGlow] = useState(() => profile.socialLinksGlow !== false);
  const [copyableSocialsInternal, setCopyableSocialsInternal] = useState(
    () => profile.copyableSocials ?? false
  );
  const useLiftedCopyable = setCopyableSocialsProp != null;
  const copyableSocials = useLiftedCopyable ? (copyableSocialsProp ?? false) : copyableSocialsInternal;
  const setCopyableSocials = useLiftedCopyable ? setCopyableSocialsProp : setCopyableSocialsInternal;

  const profileUpdatedAtMs = (profile as { updatedAt?: Date }).updatedAt?.getTime?.() ?? 0;
  useEffect(() => {
    if (useLiftedCopyable) return;
    setCopyableSocialsInternal(profile.copyableSocials ?? false);
  }, [profile.id, profileUpdatedAtMs, useLiftedCopyable, profile.copyableSocials]);

  const linkTypeOptions = useMemo(() => {
    const inUse = new Set(
      linkEntries
        .filter((e) => (PREMIUM_MONETIZATION_LINK_TYPES as readonly string[]).includes(e.type))
        .map((e) => e.type)
    );
    return LINK_TYPES.filter(
      (t) =>
        hasPremiumAccess ||
        !(PREMIUM_MONETIZATION_LINK_TYPES as readonly string[]).includes(t.value) ||
        inUse.has(t.value)
    );
  }, [hasPremiumAccess, linkEntries]);

  const [state, formAction] = useActionState<ProfileFormState, FormData>(updateLinksAction, null);

  useEffect(() => {
    if (state?.success) toast.success("Links saved");
  }, [state?.success]);

  const payload = linkEntriesToFormPayload(linkEntries);

  return (
    <div className="space-y-6 max-w-2xl">
      {!embedded && (
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Links</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage your profile buttons. These appear on your{" "}
            <Link href={`/${profile.slug}`} className="text-[var(--accent)] hover:underline">
              public profile
            </Link>
            . For short redirect URLs, see{" "}
            <Link href="/dashboard/short" className="text-[var(--accent)] hover:underline">
              Short links
            </Link>
            .
          </p>
        </div>
      )}

      <form id={formId} action={formAction} className="space-y-6">
        <input type="hidden" name="profileId" value={profile.id} />
        <input type="hidden" name="discord" value={payload.discord} />
        <input type="hidden" name="roblox" value={payload.roblox} />
        <input type="hidden" name="links" value={payload.linksJson} />
        <input type="hidden" name="socialLinksGlow" value={socialLinksGlow ? "true" : "false"} />

        {state?.error && (
          <p className="rounded-lg border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-2 text-sm text-[var(--warning)]">
            {state.error}
          </p>
        )}

        {/* Primary website */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <span className="text-sm font-medium text-[var(--foreground)]">Primary link</span>
          </div>
          <div className="p-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-2 text-xs text-[var(--foreground)]">
              <input
                type="checkbox"
                name="copyableSocials"
                value="on"
                checked={copyableSocials}
                onChange={(e) => setCopyableSocials(e.target.checked)}
                className="mt-0.5 rounded border-[var(--border)]"
              />
              <span>
                <span className="font-medium">Copyable socials</span>
                <span className="block text-[var(--muted)] mt-0.5">
                  When on, only http(s) and mailto links open in the browser; other values (handles, plain text) copy on tap.
                </span>
              </span>
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              Website / portfolio <span className="text-[var(--muted)]/70">(shown prominently on profile)</span>
              <input
                type={copyableSocials ? "text" : "url"}
                name="websiteUrl"
                defaultValue={(profile as { websiteUrl?: string }).websiteUrl ?? ""}
                placeholder={copyableSocials ? "https://… or @handle" : "https://…"}
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
          </div>
        </div>

        {/* Button links */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
            <LinkIcon size={18} className="text-[var(--accent)] shrink-0" />
            <span className="text-sm font-medium text-[var(--foreground)]">Button links</span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-[var(--muted)]">
              Add links with icons that appear as buttons on your profile (Discord, GitHub, Twitch, Ko-fi, OnlyFans, NameMC,
              email, etc.).
              {!hasPremiumAccess && (
                <>
                  {" "}
                  <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">
                    Premium
                  </Link>{" "}
                  unlocks Ko-fi, Throne, and Amazon wishlist buttons.
                </>
              )}
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={socialLinksGlow}
                onChange={(e) => setSocialLinksGlow(e.target.checked)}
                className="rounded border-[var(--border)]"
              />
              <span>Hover glow on link buttons</span>
            </label>
            <div className="space-y-3">
              {linkEntries.map((entry, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--border)]/60 bg-[var(--bg)]/60 p-2"
                >
                  <label className="w-36 shrink-0 text-xs font-medium text-[var(--muted)]">
                    Icon
                    <div className="mt-1">
                      <SearchableSelect
                        value={entry.type}
                        onChange={(v) =>
                          setLinkEntries((prev) =>
                            prev.map((p, i) => (i === index ? { ...p, type: v as LinkEntry["type"] } : p))
                          )
                        }
                        options={linkTypeOptions.map((t) => ({ value: t.value, label: t.label }))}
                        placeholder="Select…"
                        searchPlaceholder="Search…"
                        searchThreshold={8}
                      />
                    </div>
                  </label>
                  {(entry.type === "custom" && (
                    <>
                      <label className="min-w-[80px] flex-1 text-xs font-medium text-[var(--muted)]">
                        Label
                        <input
                          type="text"
                          value={entry.customLabel ?? ""}
                          onChange={(e) =>
                            setLinkEntries((prev) =>
                              prev.map((p, i) =>
                                i === index ? { ...p, customLabel: e.target.value } : p
                              )
                            )
                          }
                          placeholder="Link name"
                          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                      </label>
                      <label className="min-w-[160px] flex-1 text-xs font-medium text-[var(--muted)]">
                        Icon (optional)
                        <div className="mt-1">
                          <SearchableSelect
                            value={entry.customIconName ?? ""}
                            onChange={(v) =>
                              setLinkEntries((prev) =>
                                prev.map((p, i) =>
                                  i === index ? { ...p, customIconName: v || undefined } : p
                                )
                              )
                            }
                            options={BADGE_ICON_OPTIONS}
                            placeholder="Default"
                            searchPlaceholder="Search icon…"
                          />
                        </div>
                      </label>
                    </>
                  )) ||
                    null}
                  <label className="min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
                    {entry.type === "discord" ? "Username" : entry.type === "email" ? "Email or mailto" : "URL"}
                    <input
                      type={
                        entry.type === "discord" || entry.type === "email" || copyableSocials ? "text" : "url"
                      }
                      value={entry.value}
                      onChange={(e) =>
                        setLinkEntries((prev) =>
                          prev.map((p, i) => (i === index ? { ...p, value: e.target.value } : p))
                        )
                      }
                      placeholder={
                        linkTypeOptions.find((t) => t.value === entry.type)?.placeholder ??
                          LINK_TYPES.find((t) => t.value === entry.type)?.placeholder ??
                          "https://…"
                      }
                      className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setLinkEntries((prev) => prev.filter((_, i) => i !== index))}
                    className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-2 text-xs text-[var(--muted)] hover:text-[var(--warning)]"
                    aria-label="Remove link"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLinkEntries((prev) => [...prev, { type: "website", value: "" }])}
                className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)]/40 px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                + Add link
              </button>
            </div>
          </div>
        </div>

        <SaveButton />
      </form>
    </div>
  );
}
