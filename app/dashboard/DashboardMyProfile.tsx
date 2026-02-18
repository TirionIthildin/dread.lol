"use client";

import Link from "next/link";
import {
  PencilSimple,
  Eye,
  List,
  Notebook,
  Link as LinkIcon,
  Image,
  Palette,
  SlidersHorizontal,
  Terminal,
} from "@phosphor-icons/react";
import { useActionState, useState, useCallback } from "react";
import { useFormStatus } from "react-dom";
import type { ProfileRow, ProfileViewRow } from "@/lib/db/schema";
import { updateProfileAction, type ProfileFormState } from "@/app/dashboard/actions";
import { normalizeSlug, SLUG_MAX_LENGTH } from "@/lib/slug";

const dashIcon = { size: 18, weight: "regular" as const, className: "shrink-0" };
const TAGLINE_MAX = 120;
const DESCRIPTION_MAX = 2000;

const SECTION_KEYS = ["basics", "links", "banner", "terminal", "display", "fun"] as const;

function parseTerminalCommandsForEditor(raw: string | null): { command: string; output: string }[] {
  if (!raw?.trim()) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is { command: string; output: string } =>
        x != null && typeof x === "object" && typeof (x as { command?: string }).command === "string" && typeof (x as { output?: string }).output === "string"
    ).map((x) => ({ command: x.command, output: x.output }));
  } catch {
    return [];
  }
}

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

const LINK_TYPES = [
  { value: "discord", label: "Discord", placeholder: "e.g. @username" },
  { value: "roblox", label: "Roblox", placeholder: "https://www.roblox.com/users/…/profile" },
  { value: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { value: "twitter", label: "Twitter / X", placeholder: "https://x.com/username" },
  { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/…" },
  { value: "website", label: "Website", placeholder: "https://…" },
  { value: "custom", label: "Custom", placeholder: "https://…" },
] as const;

/** Grouped IANA timezones for local time display. */
const TIMEZONE_GROUPS: { label: string; zones: string[] }[] = [
  { label: "Americas", zones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "America/Phoenix", "America/Toronto", "America/Vancouver", "America/Montreal", "America/Mexico_City", "America/Sao_Paulo", "America/Buenos_Aires"] },
  { label: "Europe", zones: ["Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Amsterdam", "Europe/Dublin", "Europe/Madrid", "Europe/Rome", "Europe/Stockholm", "Europe/Copenhagen", "Europe/Warsaw", "Europe/Prague", "Europe/Vienna", "Europe/Zurich", "Europe/Athens", "Europe/Helsinki", "Europe/Istanbul"] },
  { label: "Asia / Pacific", zones: ["Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Bangkok", "Asia/Kolkata", "Asia/Dubai", "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland"] },
];

type LinkType = (typeof LINK_TYPES)[number]["value"];

interface LinkEntry {
  type: LinkType;
  value: string;
  customLabel?: string;
}

function parseLinkEntries(profile: ProfileRow): LinkEntry[] {
  const entries: LinkEntry[] = [];
  if (profile.discord?.trim()) entries.push({ type: "discord", value: profile.discord.trim() });
  if (profile.roblox?.trim()) entries.push({ type: "roblox", value: profile.roblox.trim() });
  if (profile.links?.trim()) {
    try {
      const arr = JSON.parse(profile.links) as unknown;
      if (Array.isArray(arr)) {
        for (const x of arr) {
          if (x && typeof (x as { href?: string }).href === "string") {
            const href = (x as { href: string }).href.trim();
            const label = (x as { label?: string }).label?.trim()?.toLowerCase();
            let type: LinkType = "website";
            if (label?.includes("github")) type = "github";
            else if (label?.includes("twitter") || label?.includes("x.com")) type = "twitter";
            else if (label?.includes("youtube")) type = "youtube";
            else if (label) type = "custom";
            entries.push({
              type,
              value: href,
              customLabel: type === "custom" ? (x as { label: string }).label : undefined,
            });
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return entries;
}

function linkEntriesToFormPayload(entries: LinkEntry[]): { discord: string; roblox: string; linksJson: string } {
  let discord = "";
  let roblox = "";
  const links: { label: string; href: string }[] = [];
  for (const e of entries) {
    if (!e.value.trim()) continue;
    if (e.type === "discord") {
      if (!discord) discord = e.value.trim();
    } else if (e.type === "roblox") {
      if (!roblox) roblox = e.value.trim();
    } else {
      const label = e.type === "custom" && e.customLabel?.trim()
        ? e.customLabel.trim()
        : LINK_TYPES.find((t) => t.value === e.type)?.label ?? "Link";
      links.push({ label, href: e.value.trim() });
    }
  }
  return { discord, roblox, linksJson: links.length ? JSON.stringify(links) : "" };
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
  icon,
  children,
}: { active: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`min-w-[5rem] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
        active
          ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--surface)]"
          : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]"
      }`}
    >
      {icon}
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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    basics: true,
    links: false,
    banner: false,
    terminal: false,
    display: false,
    fun: false,
  }));
  const [slugValue, setSlugValue] = useState(profile.slug);
  const [terminalCommandEntries, setTerminalCommandEntries] = useState<{ command: string; output: string }[]>(
    () => parseTerminalCommandsForEditor(profile.terminalCommands ?? null)
  );
  const [taglineValue, setTaglineValue] = useState(profile.tagline ?? "");
  const [descriptionValue, setDescriptionValue] = useState(profile.description);
  const [bannerValue, setBannerValue] = useState(profile.banner ?? "");
  const [linkEntries, setLinkEntries] = useState<LinkEntry[]>(() => parseLinkEntries(profile));
  const [avatarUrlValue, setAvatarUrlValue] = useState(profile.avatarUrl ?? "");
  const [slugCheck, setSlugCheck] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const checkSlugAvailability = useCallback(async () => {
    const s = normalizeSlug(slugValue);
    if (!s) {
      setSlugCheck("idle");
      return;
    }
    setSlugCheck("checking");
    try {
      const res = await fetch(
        `/api/dashboard/slug-available?slug=${encodeURIComponent(s)}&currentProfileId=${profile.id}`
      );
      const data = await res.json();
      setSlugCheck(data.available ? "available" : "taken");
    } catch {
      setSlugCheck("idle");
    }
  }, [slugValue, profile.id]);

  const expandAll = () => setOpenSections(Object.fromEntries(SECTION_KEYS.map((k) => [k, true])));
  const collapseAll = () => setOpenSections(Object.fromEntries(SECTION_KEYS.map((k) => [k, false])));

  return (
    <div className="space-y-6">
      {/* Nav bar: link + copy + view count + tab switcher */}
      <nav
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm transition-shadow duration-200 hover:shadow-md"
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
          {(profile.showPageViews ?? true) && (
            <p className="text-sm font-medium text-[var(--foreground)]">
              {viewCount} view{viewCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex border-b border-[var(--border)] bg-[var(--bg)]/50">
          <TabButton active={tab === "editor"} onClick={() => setTab("editor")} icon={<PencilSimple {...dashIcon} />}>
            Editor
          </TabButton>
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")} icon={<Eye {...dashIcon} />}>
            Preview
          </TabButton>
          <TabButton active={tab === "logs"} onClick={() => setTab("logs")} icon={<List {...dashIcon} />}>
            Logs
          </TabButton>
        </div>
      </nav>

      {tab === "editor" && (
      <section className="animate-dashboard-panel rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-[var(--bg)]/80">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" aria-hidden />
            <span className="ml-2 text-xs text-[var(--muted)] font-mono inline-flex items-center gap-2">
              <PencilSimple size={14} weight="regular" /> Editor
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Preview in new tab
            </Link>
            <span className="text-[var(--border)]">|</span>
            <button type="button" onClick={expandAll} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
              Expand all
            </button>
            <button type="button" onClick={collapseAll} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
              Collapse all
            </button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="profileId" value={profile.id} />
            <details
              className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 transition-colors duration-200 hover:border-[var(--border)]"
              open={openSections.basics}
              onToggle={(e) => setOpenSections((s) => ({ ...s, basics: (e.target as HTMLDetailsElement).open }))}
            >
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2"><Notebook {...dashIcon} /> Basics</span>
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-[var(--muted)]">
                Slug (URL path)
                <input
                  type="text"
                  name="slug"
                  value={slugValue}
                  onChange={(e) => { setSlugValue(e.target.value.slice(0, SLUG_MAX_LENGTH)); setSlugCheck("idle"); }}
                  onBlur={checkSlugAvailability}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  pattern="[a-z0-9_-]+"
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
                Name
                <input
                  type="text"
                  name="name"
                  defaultValue={profile.name}
                  maxLength={100}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </label>
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
            </div>
            <label className="block text-xs font-medium text-[var(--muted)]">
              Location / Based in <span className="text-[var(--muted)]/70">(e.g. NYC, Berlin)</span>
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
              Local time <span className="text-[var(--muted)]/70">(timezone — your current time is shown on profile)</span>
              <select
                name="timezone"
                defaultValue={(profile as { timezone?: string }).timezone ?? ""}
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">None</option>
                {TIMEZONE_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.zones.map((tz) => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="flex gap-3 items-start">
              <label className="flex-1 min-w-0 block text-xs font-medium text-[var(--muted)]">
                Avatar URL
                <input
                  type="url"
                  name="avatarUrl"
                  value={avatarUrlValue}
                  onChange={(e) => setAvatarUrlValue(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </label>
              {avatarUrlValue && (
                <div className="shrink-0 pt-6">
                  <img
                    src={avatarUrlValue}
                    alt=""
                    className="h-12 w-12 rounded-full border border-[var(--border)] object-cover bg-[var(--bg)]"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>
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
              Description <span className="text-[var(--muted)]/70">(Markdown supported: **bold**, [links](url), lists)</span>
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
            <label className="block text-xs font-medium text-[var(--muted)]">
              Status <span className="text-[var(--muted)]/70">(Markdown ok)</span>
              <input
                type="text"
                name="status"
                defaultValue={profile.status ?? ""}
                placeholder="e.g. Building something"
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
              </div>
            </details>

            {(() => {
              const payload = linkEntriesToFormPayload(linkEntries);
              return (
                <>
                  <input type="hidden" name="discord" value={payload.discord} />
                  <input type="hidden" name="roblox" value={payload.roblox} />
                  <input type="hidden" name="links" value={payload.linksJson} />
                  <input type="hidden" name="terminalCommands" value={JSON.stringify(terminalCommandEntries.filter((e) => e.command.trim() || e.output.trim()))} />
                </>
              );
            })()}
            <details
              className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 transition-colors duration-200 hover:border-[var(--border)]"
              open={openSections.links}
              onToggle={(e) => setOpenSections((s) => ({ ...s, links: (e.target as HTMLDetailsElement).open }))}
            >
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2"><LinkIcon {...dashIcon} /> Links</span>
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
              <p className="text-xs font-medium text-[var(--muted)] mb-1">Choose an icon and enter URL or username</p>
              <div className="space-y-3">
                {linkEntries.map((entry, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--border)]/60 bg-[var(--bg)]/60 p-2">
                    <label className="w-32 shrink-0 text-xs font-medium text-[var(--muted)]">
                      Icon
                      <select
                        value={entry.type}
                        onChange={(e) =>
                          setLinkEntries((prev) =>
                            prev.map((p, i) =>
                              i === index ? { ...p, type: e.target.value as LinkType } : p
                            )
                          )
                        }
                        className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      >
                        {LINK_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
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
                    )) || null}
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
                        placeholder={LINK_TYPES.find((t) => t.value === entry.type)?.placeholder ?? "https://…"
                        }
                        className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
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
            </details>

            <details
              className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 transition-colors duration-200 hover:border-[var(--border)]"
              open={openSections.banner}
              onToggle={(e) => setOpenSections((s) => ({ ...s, banner: (e.target as HTMLDetailsElement).open }))}
            >
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2"><Image {...dashIcon} /> Banner</span>
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
              <p className="text-xs font-medium text-[var(--muted)] mb-1">ASCII banner and options</p>
              <div className="flex items-end gap-2">
                <label className="flex-1 min-w-0 block text-xs font-medium text-[var(--muted)]">
                  ASCII banner <span className="text-[var(--muted)]/70">(optional, shown at top of profile)</span>
                  <textarea
                    name="banner"
                    rows={4}
                    value={bannerValue}
                    onChange={(e) => setBannerValue(e.target.value)}
                    placeholder="Paste ASCII art here…"
                    className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setBannerValue("")}
                  className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Banner gradient
                  <select
                    name="bannerStyle"
                    defaultValue={
                      profile.bannerStyle ?? (profile.bannerAnimatedFire ? "fire" : "accent")
                    }
                    className="mt-1 block w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    <option value="accent">Default (accent)</option>
                    <option value="fire">Fire</option>
                    <option value="cyan">Cyan</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                    <option value="rose">Rose</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)] pt-6">
                  <input type="checkbox" name="bannerSmall" defaultChecked={profile.bannerSmall ?? false} className="rounded border-[var(--border)]" />
                  Smaller font
                </label>
              </div>
              </div>
            </details>

            <details
              className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 transition-colors duration-200 hover:border-[var(--border)]"
              open={openSections.terminal}
              onToggle={(e) => setOpenSections((s) => ({ ...s, terminal: (e.target as HTMLDetailsElement).open }))}
            >
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2"><Terminal {...dashIcon} /> Command window</span>
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
              <p className="text-xs font-medium text-[var(--muted)] mb-1">Show your profile as a terminal with custom commands (like the homepage)</p>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  name="useTerminalLayout"
                  defaultChecked={profile.useTerminalLayout ?? false}
                  className="rounded border-[var(--border)]"
                />
                Use terminal layout
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Window title
                <input
                  type="text"
                  name="terminalTitle"
                  defaultValue={profile.terminalTitle ?? ""}
                  placeholder="user@slug:~"
                  maxLength={80}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
                />
              </label>
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--muted)]">Custom commands (command → output). Output supports Markdown.</p>
                {terminalCommandEntries.map((entry, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--border)]/60 bg-[var(--bg)]/60 p-2">
                    <label className="min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
                      Command
                      <input
                        type="text"
                        value={entry.command}
                        onChange={(e) =>
                          setTerminalCommandEntries((prev) =>
                            prev.map((p, i) => (i === index ? { ...p, command: e.target.value } : p))
                          )
                        }
                        placeholder="cat intro.txt"
                        className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm font-mono focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </label>
                    <label className="min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
                      Output
                      <input
                        type="text"
                        value={entry.output}
                        onChange={(e) =>
                          setTerminalCommandEntries((prev) =>
                            prev.map((p, i) => (i === index ? { ...p, output: e.target.value } : p))
                          )
                        }
                        placeholder="Hello, I'm …"
                        className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setTerminalCommandEntries((prev) => prev.filter((_, i) => i !== index))}
                      className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--warning)]"
                      aria-label="Remove command"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setTerminalCommandEntries((prev) => [...prev, { command: "", output: "" }])}
                  className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)]/40 px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  + Add command
                </button>
              </div>
              </div>
            </details>

            <details
              className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 transition-colors duration-200 hover:border-[var(--border)]"
              open={openSections.display}
              onToggle={(e) => setOpenSections((s) => ({ ...s, display: (e.target as HTMLDetailsElement).open }))}
            >
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2"><Palette {...dashIcon} /> Display & sharing</span>
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
              <label className="block text-xs font-medium text-[var(--muted)]">
                Meta description <span className="text-[var(--muted)]/70">(override for social/SEO; leave blank to use tagline or description)</span>
                <textarea
                  name="metaDescription"
                  defaultValue={(profile as { metaDescription?: string }).metaDescription ?? ""}
                  placeholder="Optional"
                  rows={2}
                  maxLength={200}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                <input type="checkbox" name="noindex" defaultChecked={(profile as { noindex?: boolean }).noindex ?? false} className="rounded border-[var(--border)]" />
                Ask search engines not to index this profile <span className="text-[var(--muted)]/70">(noindex)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                <input type="checkbox" name="showUpdatedAt" defaultChecked={profile.showUpdatedAt ?? false} className="rounded border-[var(--border)]" />
                Show “Last updated” date on profile
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                <input type="checkbox" name="showPageViews" defaultChecked={profile.showPageViews ?? true} className="rounded border-[var(--border)]" />
                Display page views in dashboard
              </label>
              </div>
            </details>

            <details
              className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 transition-colors duration-200 hover:border-[var(--border)]"
              open={openSections.fun}
              onToggle={(e) => setOpenSections((s) => ({ ...s, fun: (e.target as HTMLDetailsElement).open }))}
            >
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-[var(--muted)] select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2"><SlidersHorizontal {...dashIcon} /> Fun & style</span>
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--border)]/50 mt-0 pt-3">
              <p className="text-xs font-medium text-[var(--muted)] mb-1">Accent color, terminal prompt, greeting, card look</p>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Accent color
                <select
                  name="accentColor"
                  defaultValue={profile.accentColor ?? ""}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Default (cyan)</option>
                  <option value="cyan">Cyan</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="rose">Rose</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Terminal prompt <span className="text-[var(--muted)]/70">(e.g. $, &gt;, λ, ❯)</span>
                <input
                  type="text"
                  name="terminalPrompt"
                  defaultValue={profile.terminalPrompt ?? ""}
                  placeholder="$"
                  maxLength={8}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Name greeting <span className="text-[var(--muted)]/70">(text before your name, e.g. &quot;hi i&apos;m&quot;, &quot;aka&quot;)</span>
                <input
                  type="text"
                  name="nameGreeting"
                  defaultValue={profile.nameGreeting ?? ""}
                  placeholder="hi i'm"
                  maxLength={40}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Avatar shape
                <select
                  name="avatarShape"
                  defaultValue={(profile as { avatarShape?: string }).avatarShape ?? "circle"}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="circle">Circle</option>
                  <option value="rounded">Rounded square</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Layout density
                <select
                  name="layoutDensity"
                  defaultValue={(profile as { layoutDensity?: string }).layoutDensity ?? "default"}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                  <option value="spacious">Spacious</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Card style
                <select
                  name="cardStyle"
                  defaultValue={profile.cardStyle ?? "default"}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="default">Default (rounded)</option>
                  <option value="sharp">Sharp corners</option>
                  <option value="glass">Glass (blur)</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Status indicator <span className="text-[var(--muted)]/70">(Discord-style dot; not synced with Discord — API doesn’t provide presence)</span>
                <select
                  name="displayStatus"
                  defaultValue={profile.displayStatus ?? ""}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">None</option>
                  <option value="online">Online (green)</option>
                  <option value="idle">Idle (yellow)</option>
                  <option value="busy">Busy / DND (red)</option>
                  <option value="offline">Offline (gray)</option>
                </select>
              </label>
              </div>
            </details>

            {state?.success && (
              <p className="text-sm text-[var(--terminal)]" role="status">
                Profile saved.
                {state.savedAt && (
                  <span className="text-[var(--muted)] ml-1">
                    (Saved at {new Date(state.savedAt).toLocaleTimeString(undefined, { timeStyle: "short" })})
                  </span>
                )}
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
      <section className="animate-dashboard-panel rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" aria-hidden />
          <span className="ml-2 text-xs text-[var(--muted)] font-mono inline-flex items-center gap-2">
            <Eye size={14} weight="regular" /> Preview
          </span>
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
      <section className="animate-dashboard-panel rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 bg-[var(--bg)]/80">
          <span className="ml-2 text-xs text-[var(--muted)] font-mono inline-flex items-center gap-2">
            <List size={14} weight="regular" /> Recent visitors
          </span>
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
