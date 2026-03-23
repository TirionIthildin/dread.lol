"use client";

import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { FloppyDisk, Link as LinkIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import SearchableSelect from "@/app/components/SearchableSelect";
import {
  updateLinksAction,
  type ProfileFormState,
} from "@/app/dashboard/actions";
import type { ProfileRow } from "@/lib/db/schema";
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
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/20 px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] disabled:opacity-50"
    >
      <FloppyDisk size={18} weight="regular" />
      {pending ? "Saving…" : "Save links"}
    </button>
  );
}

export default function DashboardLinks({ profile, embedded, formId }: DashboardLinksProps) {
  const [linkEntries, setLinkEntries] = useState<LinkEntry[]>(() => parseLinkEntries(profile));

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
          <div className="p-4">
            <label className="block text-xs font-medium text-[var(--muted)]">
              Website / portfolio <span className="text-[var(--muted)]/70">(shown prominently on profile)</span>
              <input
                type="url"
                name="websiteUrl"
                defaultValue={(profile as { websiteUrl?: string }).websiteUrl ?? ""}
                placeholder="https://…"
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
          </div>
        </div>

        {/* Button links */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
            <LinkIcon size={18} weight="regular" className="text-[var(--accent)] shrink-0" />
            <span className="text-sm font-medium text-[var(--foreground)]">Button links</span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-[var(--muted)]">
              Add links with icons that appear as buttons on your profile (Discord, GitHub, Twitch, etc.).
            </p>
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
                        options={LINK_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                        placeholder="Select…"
                        searchPlaceholder="Search…"
                        searchThreshold={8}
                      />
                    </div>
                  </label>
                  {(entry.type === "custom" && (
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
                  )) ||
                    null}
                  <label className="min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
                    {entry.type === "discord" ? "Username" : "URL"}
                    <input
                      type={entry.type === "discord" ? "text" : "url"}
                      value={entry.value}
                      onChange={(e) =>
                        setLinkEntries((prev) =>
                          prev.map((p, i) => (i === index ? { ...p, value: e.target.value } : p))
                        )
                      }
                      placeholder={
                        LINK_TYPES.find((t) => t.value === entry.type)?.placeholder ?? "https://…"
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
