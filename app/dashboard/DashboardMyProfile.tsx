"use client";

import Link from "next/link";
import { useActionState, useState, useCallback } from "react";
import { useFormStatus } from "react-dom";
import type { ProfileRow, ProfileViewRow } from "@/lib/db/schema";
import { updateProfileAction, type ProfileFormState } from "@/app/dashboard/actions";

interface DashboardMyProfileProps {
  profile: ProfileRow;
  viewCount: number;
  recentViews: ProfileViewRow[];
}

function formatDate(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatLinksForEditor(linksJson: string | null): string {
  if (!linksJson?.trim()) return "";
  try {
    const arr = JSON.parse(linksJson) as unknown;
    if (!Array.isArray(arr)) return "";
    return arr
      .filter((x): x is { label: string; href: string } => x != null && typeof (x as { label?: string }).label === "string" && typeof (x as { href?: string }).href === "string")
      .map(({ label, href }) => `${label} | ${href}`)
      .join("\n");
  } catch {
    return "";
  }
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] disabled:opacity-50 disabled:pointer-events-none"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

function CopyProfileUrlButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : "";
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [slug]);
  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
    >
      {copied ? "Copied!" : "Copy URL"}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`min-w-[5rem] flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active
          ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--surface)]"
          : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]"
      }`}
    >
      {children}
    </button>
  );
}

type DashboardTab = "editor" | "preview" | "logs";

export default function DashboardMyProfile({
  profile,
  viewCount,
  recentViews,
}: DashboardMyProfileProps) {
  const [tab, setTab] = useState<DashboardTab>("editor");
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    null
  );

  return (
    <div className="space-y-6">
      {/* Nav bar: link + copy + view count + tab switcher */}
      <nav
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
        aria-label="Profile dashboard"
      >
        <div className="border-b border-[var(--border)] px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-[var(--bg)]/80">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <span>Your page:{" "}</span>
            <Link
              href={`/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              /{profile.slug}
            </Link>
            <CopyProfileUrlButton slug={profile.slug} />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {viewCount} view{viewCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex border-b border-[var(--border)] bg-[var(--bg)]/50">
          <TabButton active={tab === "editor"} onClick={() => setTab("editor")}>
            Editor
          </TabButton>
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
            Preview
          </TabButton>
          <TabButton active={tab === "logs"} onClick={() => setTab("logs")}>
            Logs
          </TabButton>
        </div>
      </nav>

      {tab === "editor" && (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" aria-hidden />
          <span className="ml-2 text-xs text-[var(--muted)] font-mono">Editor</span>
        </div>
        <div className="p-4 space-y-4">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="profileId" value={profile.id} />
            <details className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40" open>
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">Basics</span>
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-[var(--muted)]">
                Slug (URL path)
                <input
                  type="text"
                  name="slug"
                  defaultValue={profile.slug}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  pattern="[a-z0-9_-]+"
                  title="Letters, numbers, hyphen, underscore only"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Name
                <input
                  type="text"
                  name="name"
                  defaultValue={profile.name}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </label>
            </div>
            <label className="block text-xs font-medium text-[var(--muted)]">
              Avatar URL
              <input
                type="url"
                name="avatarUrl"
                defaultValue={profile.avatarUrl ?? ""}
                placeholder="https://…"
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              Tagline
              <input
                type="text"
                name="tagline"
                defaultValue={profile.tagline ?? ""}
                placeholder="Optional"
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              Description
              <textarea
                name="description"
                defaultValue={profile.description}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              Status
              <input
                type="text"
                name="status"
                defaultValue={profile.status ?? ""}
                placeholder="e.g. Building something"
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              Quote
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
              </div>
            </details>

            <details className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                Links
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
              <p className="text-xs font-medium text-[var(--muted)] mb-1">Discord, Roblox, extra links</p>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Discord <span className="text-[var(--muted)]/70">(e.g. @username, click-to-copy on profile)</span>
                  <input
                    type="text"
                    name="discord"
                    defaultValue={profile.discord ?? ""}
                    placeholder="@username"
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Roblox profile URL
                  <input
                    type="url"
                    name="roblox"
                    defaultValue={profile.roblox ?? ""}
                    placeholder="https://www.roblox.com/users/…/profile"
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Extra links <span className="text-[var(--muted)]/70">(one per line: label | url)</span>
                  <textarea
                    name="links"
                    rows={3}
                    defaultValue={formatLinksForEditor(profile.links)}
                    placeholder={"GitHub | https://github.com/you\nTwitter | https://twitter.com/you"}
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
                  />
                </label>
              </div>
              </div>
            </details>

            <details className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                Banner
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
              <p className="text-xs font-medium text-[var(--muted)] mb-1">ASCII banner and options</p>
              <label className="block text-xs font-medium text-[var(--muted)]">
                ASCII banner <span className="text-[var(--muted)]/70">(optional, shown at top of profile)</span>
                <textarea
                  name="banner"
                  rows={4}
                  defaultValue={profile.banner ?? ""}
                  placeholder="Paste ASCII art here…"
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
                />
              </label>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                  <input type="checkbox" name="bannerSmall" defaultChecked={profile.bannerSmall ?? false} className="rounded border-[var(--border)]" />
                  Smaller font
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                  <input type="checkbox" name="bannerAnimatedFire" defaultChecked={profile.bannerAnimatedFire ?? false} className="rounded border-[var(--border)]" />
                  Animated fire gradient
                </label>
              </div>
              </div>
            </details>

            <details className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                Easter eggs
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
              <p className="text-xs font-medium text-[var(--muted)] mb-1">Bat, tagline word, link-on-word</p>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)] mb-3">
                <input type="checkbox" name="easterEgg" defaultChecked={profile.easterEgg ?? false} className="rounded border-[var(--border)]" />
                Bat 🦇 in description is clickable
              </label>
              <div className="grid gap-3 sm:grid-cols-2 mt-2">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Tagline trigger word <span className="text-[var(--muted)]/70">(easter egg on click)</span>
                  <input
                    type="text"
                    name="easterEggTaglineWord"
                    defaultValue={profile.easterEggTaglineWord ?? ""}
                    placeholder="e.g. sanity"
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </label>
              </div>
              <p className="text-xs text-[var(--muted)]/80 mt-2 mb-2">Or: word in tagline that opens a link (optional popup URL):</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Word
                  <input
                    type="text"
                    name="easterEggLinkTrigger"
                    defaultValue={profile.easterEggLinkTrigger ?? ""}
                    placeholder="Ithildin"
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Link URL
                  <input
                    type="url"
                    name="easterEggLinkUrl"
                    defaultValue={profile.easterEggLinkUrl ?? ""}
                    placeholder="https://…"
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Popup URL <span className="text-[var(--muted)]/70">(optional)</span>
                  <input
                    type="url"
                    name="easterEggLinkPopupUrl"
                    defaultValue={profile.easterEggLinkPopupUrl ?? ""}
                    placeholder="https://…"
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </label>
              </div>
              </div>
            </details>

            <details className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                Display & sharing
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
              <label className="block text-xs font-medium text-[var(--muted)]">
                Custom OG image URL <span className="text-[var(--muted)]/70">(for social previews; leave blank to use avatar)</span>
                <input
                  type="url"
                  name="ogImageUrl"
                  defaultValue={profile.ogImageUrl ?? ""}
                  placeholder="https://…"
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                <input type="checkbox" name="showUpdatedAt" defaultChecked={profile.showUpdatedAt ?? false} className="rounded border-[var(--border)]" />
                Show “Last updated” date on profile
              </label>
              </div>
            </details>

            {state?.success && (
              <p className="text-sm text-[var(--terminal)]" role="status">
                Profile saved.
              </p>
            )}
            {state?.error && (
              <p className="text-sm text-[var(--warning)]" role="alert">
                {state.error}
              </p>
            )}
            <SubmitButton />
          </form>
        </div>
      </section>
      )}

      {tab === "preview" && (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" aria-hidden />
          <span className="ml-2 text-xs text-[var(--muted)] font-mono">Preview</span>
        </div>
        <p className="px-4 py-2 text-xs text-[var(--muted)] border-b border-[var(--border)]/50">
          Live page. Save changes in Editor to see updates.
        </p>
        <div className="relative w-full min-h-[60vh] bg-[var(--bg)]">
          <iframe
            src={`/${profile.slug}`}
            title={`Preview of /${profile.slug}`}
            className="absolute inset-0 w-full h-full min-h-[60vh] rounded-b-xl border-0"
          />
        </div>
      </section>
      )}

      {tab === "logs" && (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
          <span className="ml-2 text-xs text-[var(--muted)] font-mono">Recent visitors</span>
        </div>
        <div className="overflow-x-auto">
          {recentViews.length === 0 ? (
            <p className="p-4 text-sm text-[var(--muted)]">No views yet.</p>
          ) : (
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {recentViews.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-[var(--border)]/70 last:border-b-0"
                  >
                    <td className="px-4 py-2 font-medium text-[var(--foreground)]">
                      {v.visitorIp}
                    </td>
                    <td className="px-4 py-2 text-[var(--muted)]">
                      {formatDate(v.viewedAt)}
                    </td>
                    <td className="hidden max-w-[240px] truncate px-4 py-2 text-[var(--muted)] sm:table-cell">
                      {v.userAgent ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      )}
    </div>
  );
}
