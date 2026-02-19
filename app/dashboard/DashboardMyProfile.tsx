"use client";

import Link from "next/link";
import NextImage from "next/image";
import {
  PencilSimple,
  Eye,
  Notebook,
  Link as LinkIcon,
  Image as ImageIcon,
  Palette,
  SlidersHorizontal,
  Terminal,
  Circle,
  UploadSimple,
  DiscordLogo,
  MusicNotes,
  Trash,
} from "@phosphor-icons/react";
import { useActionState, useState, useCallback, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import type { ProfileRow } from "@/lib/db/schema";
import {
  updateProfileAction,
  applyTemplateAction,
  addShortLinkAction,
  deleteShortLinkAction,
  type ProfileFormState,
} from "@/app/dashboard/actions";
import { normalizeSlug, SLUG_MAX_LENGTH } from "@/lib/slug";
import { PROFILE_TEMPLATES, type ProfileTemplate } from "@/lib/profile-templates";
import type { ProfileShortLink } from "@/lib/member-profiles";

const dashIcon = { size: 18, weight: "regular" as const, className: "shrink-0" };
const TAGLINE_MAX = 120;
const DESCRIPTION_MAX = 2000;

type EditorSectionId = "basics" | "links" | "banner" | "terminal" | "display" | "fun" | "audio";
const EDITOR_SECTIONS: { id: EditorSectionId; label: string; icon: React.ReactNode }[] = [
  { id: "basics", label: "Basics", icon: <Notebook {...dashIcon} aria-hidden /> },
  { id: "links", label: "Links", icon: <LinkIcon {...dashIcon} aria-hidden /> },
  { id: "banner", label: "Banner", icon: <ImageIcon {...dashIcon} aria-hidden /> },
  { id: "terminal", label: "Terminal", icon: <Terminal {...dashIcon} aria-hidden /> },
  { id: "display", label: "Display & SEO", icon: <Palette {...dashIcon} aria-hidden /> },
  { id: "fun", label: "Styling", icon: <SlidersHorizontal {...dashIcon} aria-hidden /> },
  { id: "audio", label: "Audio Manager", icon: <MusicNotes {...dashIcon} aria-hidden /> },
];

function TemplateConfirmModal({
  template,
  onClose,
  onConfirm,
  applying,
}: {
  template: ProfileTemplate;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  applying: boolean;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="template-modal-title" className="text-base font-semibold text-[var(--foreground)]">
          Apply template “{template.name}”?
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This will replace your tagline, description, banner, links, and other profile content. Your slug, name, and avatar stay the same. Any unsaved changes in the form will be lost.
        </p>
        {template.description && (
          <p className="mt-1 text-xs text-[var(--muted)]">{template.description}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={applying}
            className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
          >
            {applying ? "Applying…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

// .png, .jpg, .jpeg, .gif, .webp
const BACKGROUND_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/x-gif", "image/webp"];
// .mp4, .m4v, .webm, .mov, .mkv
const BACKGROUND_VIDEO_TYPES = ["video/mp4", "video/x-m4v", "video/webm", "video/quicktime", "video/x-matroska"];
// .mp3, .aac
const BACKGROUND_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/aac", "audio/x-aac"];

interface DashboardMyProfileProps {
  profile: ProfileRow;
  shortLinks?: ProfileShortLink[];
  /** Current user's Discord avatar URL (from session), for "Use Discord avatar" button. */
  discordAvatarUrl?: string | null;
}

const LINK_TYPES = [
  { value: "discord", label: "Discord", placeholder: "e.g. @username" },
  { value: "roblox", label: "Roblox", placeholder: "https://www.roblox.com/users/…/profile" },
  { value: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { value: "twitter", label: "Twitter / X", placeholder: "https://x.com/username" },
  { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/…" },
  { value: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { value: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username" },
  { value: "twitch", label: "Twitch", placeholder: "https://twitch.tv/username" },
  { value: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/…" },
  { value: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { value: "reddit", label: "Reddit", placeholder: "https://reddit.com/user/username" },
  { value: "steam", label: "Steam", placeholder: "https://steamcommunity.com/id/…" },
  { value: "paypal", label: "PayPal", placeholder: "https://paypal.me/username" },
  { value: "telegram", label: "Telegram", placeholder: "https://t.me/username" },
  { value: "patreon", label: "Patreon", placeholder: "https://patreon.com/username" },
  { value: "medium", label: "Medium", placeholder: "https://medium.com/@username" },
  { value: "mastodon", label: "Mastodon", placeholder: "https://mastodon.social/@username" },
  { value: "behance", label: "Behance", placeholder: "https://behance.net/username" },
  { value: "figma", label: "Figma", placeholder: "https://figma.com/@username" },
  { value: "notion", label: "Notion", placeholder: "https://notion.so/…" },
  { value: "codepen", label: "CodePen", placeholder: "https://codepen.io/username" },
  { value: "devto", label: "Dev.to", placeholder: "https://dev.to/username" },
  { value: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/username" },
  { value: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/username" },
  { value: "threads", label: "Threads", placeholder: "https://threads.net/@username" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/…" },
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
            else if (label?.includes("instagram")) type = "instagram";
            else if (label?.includes("tiktok")) type = "tiktok";
            else if (label?.includes("twitch")) type = "twitch";
            else if (label?.includes("spotify")) type = "spotify";
            else if (label?.includes("linkedin")) type = "linkedin";
            else if (label?.includes("reddit")) type = "reddit";
            else if (label?.includes("steam")) type = "steam";
            else if (label?.includes("paypal")) type = "paypal";
            else if (label?.includes("telegram")) type = "telegram";
            else if (label?.includes("patreon")) type = "patreon";
            else if (label?.includes("medium")) type = "medium";
            else if (label?.includes("mastodon")) type = "mastodon";
            else if (label?.includes("behance")) type = "behance";
            else if (label?.includes("figma")) type = "figma";
            else if (label?.includes("notion")) type = "notion";
            else if (label?.includes("codepen")) type = "codepen";
            else if (label?.includes("dev.to")) type = "devto";
            else if (label?.includes("soundcloud")) type = "soundcloud";
            else if (label?.includes("pinterest")) type = "pinterest";
            else if (label?.includes("threads")) type = "threads";
            else if (label?.includes("whatsapp")) type = "whatsapp";
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

type DashboardTab = "editor" | "preview";

export default function DashboardMyProfile({
  profile,
  shortLinks: initialShortLinks = [],
  discordAvatarUrl,
}: DashboardMyProfileProps) {
  const [tab, setTab] = useState<DashboardTab>("editor");
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    null
  );

  const [slugValue, setSlugValue] = useState(profile.slug);
  const [terminalCommandEntries, setTerminalCommandEntries] = useState<{ command: string; output: string }[]>(
    () => parseTerminalCommandsForEditor(profile.terminalCommands ?? null)
  );
  const [taglineValue, setTaglineValue] = useState(profile.tagline ?? "");
  const [descriptionValue, setDescriptionValue] = useState(profile.description);
  const [bannerValue, setBannerValue] = useState(profile.banner ?? "");
  const [linkEntries, setLinkEntries] = useState<LinkEntry[]>(() => parseLinkEntries(profile));
  const [shortLinks, setShortLinks] = useState<ProfileShortLink[]>(initialShortLinks);
  const [shortLinkSlug, setShortLinkSlug] = useState("");
  const [shortLinkUrl, setShortLinkUrl] = useState("");
  const [shortLinkAdding, setShortLinkAdding] = useState(false);
  const [shortLinkError, setShortLinkError] = useState<string | null>(null);
  const [shortLinkToDelete, setShortLinkToDelete] = useState<ProfileShortLink | null>(null);
  const [shortLinkDeleting, setShortLinkDeleting] = useState(false);
  const [avatarUrlValue, setAvatarUrlValue] = useState(profile.avatarUrl ?? "");
  const [slugCheck, setSlugCheck] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [templateModal, setTemplateModal] = useState<ProfileTemplate | null>(null);
  const [templateApplying, setTemplateApplying] = useState(false);
  const [activeEditorSection, setActiveEditorSection] = useState<EditorSectionId>("basics");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [backgroundTypeValue, setBackgroundTypeValue] = useState<string>(() => {
    const t = (profile as { backgroundType?: string }).backgroundType ?? "none";
    return ["image", "video", "audio"].includes(t) ? t : "none";
  });
  const [backgroundUrlValue, setBackgroundUrlValue] = useState(() => {
    const t = (profile as { backgroundType?: string }).backgroundType ?? "none";
    return ["image", "video", "audio"].includes(t) ? ((profile as { backgroundUrl?: string }).backgroundUrl ?? "") : "";
  });
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [backgroundUploadError, setBackgroundUploadError] = useState<string | null>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const [customFontValue, setCustomFontValue] = useState(() => {
    const p = profile as { customFont?: string; customFontUrl?: string };
    return p.customFontUrl ? "custom" : (p.customFont ?? "");
  });
  const [customFontUrlValue, setCustomFontUrlValue] = useState((profile as { customFontUrl?: string }).customFontUrl ?? "");
  const [customFontUploading, setCustomFontUploading] = useState(false);
  const [customFontUploadError, setCustomFontUploadError] = useState<string | null>(null);
  const customFontFileRef = useRef<HTMLInputElement>(null);
  const [cursorStyleValue, setCursorStyleValue] = useState(() => {
    const p = profile as { cursorStyle?: string; cursorImageUrl?: string };
    return p.cursorImageUrl ? "custom" : (p.cursorStyle ?? "default");
  });
  const [cursorImageUrlValue, setCursorImageUrlValue] = useState((profile as { cursorImageUrl?: string }).cursorImageUrl ?? "");
  const [cursorUploading, setCursorUploading] = useState(false);
  const [cursorUploadError, setCursorUploadError] = useState<string | null>(null);
  const cursorFileRef = useRef<HTMLInputElement>(null);
  const [showAudioPlayerValue, setShowAudioPlayerValue] = useState((profile as { showAudioPlayer?: boolean }).showAudioPlayer ?? false);
  const [audioTracksValue, setAudioTracksValue] = useState<{ url: string; title?: string }[]>(() => {
    const raw = (profile as { audioTracks?: string }).audioTracks;
    if (typeof raw === "string") {
      try {
        const arr = JSON.parse(raw) as unknown;
        if (Array.isArray(arr)) {
          return arr
            .filter((x: unknown): x is { url: string; title?: string } => x != null && typeof (x as { url?: unknown }).url === "string")
            .map((x) => ({ url: (x as { url: string }).url, title: (x as { title?: string }).title }));
        }
      } catch {
        /* ignore */
      }
    }
    if (Array.isArray(raw)) return raw as { url: string; title?: string }[];
    return [];
  });
  const [audioTrackUploading, setAudioTrackUploading] = useState(false);
  const [audioTrackUploadError, setAudioTrackUploadError] = useState<string | null>(null);
  const audioTrackFileRef = useRef<HTMLInputElement>(null);
  const [cardOpacityValue, setCardOpacityValue] = useState((profile as { cardOpacity?: number }).cardOpacity ?? 95);
  const slugCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

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

  const debouncedCheckSlug = useCallback(() => {
    if (slugCheckTimeoutRef.current) clearTimeout(slugCheckTimeoutRef.current);
    slugCheckTimeoutRef.current = setTimeout(() => {
      slugCheckTimeoutRef.current = null;
      checkSlugAvailability();
    }, 400);
  }, [checkSlugAvailability]);

  useEffect(() => () => { if (slugCheckTimeoutRef.current) clearTimeout(slugCheckTimeoutRef.current); }, []);

  // After successful save, refresh server data so form reset uses fresh profile (fixes revert-to-old-value bug)
  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  const formKey = `${profile.id}-${(profile as { updatedAt?: Date }).updatedAt?.getTime?.() ?? 0}`;

  return (
    <div className="space-y-6">
      <nav
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm"
        aria-label="Profile editor"
      >
        <div className="flex border-b border-[var(--border)] bg-[var(--bg)]/50">
          <TabButton active={tab === "editor"} onClick={() => setTab("editor")} icon={<PencilSimple {...dashIcon} />}>
            Editor
          </TabButton>
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")} icon={<Eye {...dashIcon} />}>
            Preview
          </TabButton>
        </div>
      </nav>

      {tab === "editor" && (
      <section className="animate-dashboard-panel rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm flex flex-col h-[min(75vh,800px)]">
        <div className="border-b border-[var(--border)] px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-[var(--bg)]/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" aria-hidden />
            <span className="ml-2 text-xs text-[var(--muted)] font-mono inline-flex items-center gap-2">
              <PencilSimple size={14} weight="regular" /> Editor
            </span>
          </div>
          <Link
            href={`/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Preview in new tab
          </Link>
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <nav
            className="w-48 shrink-0 border-r border-[var(--border)] bg-[var(--bg)]/50 p-2 flex flex-col gap-0.5 overflow-hidden"
            aria-label="Editor sections"
          >
            {EDITOR_SECTIONS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveEditorSection(id)}
                aria-current={activeEditorSection === id ? "true" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeEditorSection === id
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                    : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
                }`}
              >
                {icon}
                <span className="truncate">{label}</span>
              </button>
            ))}
            <div className="mt-auto pt-3 border-t border-[var(--border)] space-y-2">
              <p className="text-xs font-medium text-[var(--muted)] px-2">Templates</p>
              {PROFILE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateModal(t)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </nav>
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4">
          <form key={formKey} action={formAction} className="space-y-4 max-w-2xl">
            <input type="hidden" name="profileId" value={profile.id} />
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
            <div className={activeEditorSection === "basics" ? "block space-y-3" : "hidden"}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-[var(--muted)]">
                Slug (URL path)
                <input
                  type="text"
                  name="slug"
                  value={slugValue}
                  onChange={(e) => { setSlugValue(e.target.value.slice(0, SLUG_MAX_LENGTH)); setSlugCheck("idle"); }}
                  onBlur={debouncedCheckSlug}
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
            <label className="block text-xs font-medium text-[var(--muted)]">
              Birthday <span className="text-[var(--muted)]/70">(month & day only — shown as countdown on profile)</span>
              <div className="mt-1 flex gap-2">
                <select
                  name="birthdayMonth"
                  defaultValue={(() => {
                    const b = (profile as { birthday?: string }).birthday;
                    if (!b || !/^\d{2}-\d{2}$/.test(b)) return "";
                    return b.slice(0, 2);
                  })()}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const mm = String(i + 1).padStart(2, "0");
                    const name = new Date(2000, i, 1).toLocaleString("default", { month: "long" });
                    return <option key={mm} value={mm}>{name}</option>;
                  })}
                </select>
                <select
                  name="birthdayDay"
                  defaultValue={(() => {
                    const b = (profile as { birthday?: string }).birthday;
                    if (!b || !/^\d{2}-\d{2}$/.test(b)) return "";
                    return b.slice(3, 5);
                  })()}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>
                  ))}
                </select>
              </div>
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
            <div className="space-y-2 rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/30 px-3 py-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--foreground)]">
                <input
                  type="checkbox"
                  name="showDiscordPresence"
                  defaultChecked={(profile as { showDiscordPresence?: boolean }).showDiscordPresence !== false}
                  className="rounded border-[var(--border)]"
                />
                Show Discord presence
              </label>
              <p className="text-xs text-[var(--muted)]">
                When enabled and you’re in our Discord server, your live status (online/idle/busy) and Rich Presence (e.g. “Playing X”) appear on your profile.
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--muted)]">
                Avatar
                <input type="hidden" name="avatarUrl" value={avatarUrlValue} />
              </label>
              <div className="flex flex-wrap items-center gap-2">
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
                    onClick={() => setAvatarUrlValue(discordAvatarUrl)}
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
              {avatarUrlValue && (
                <div className="pt-1">
                  <NextImage
                    src={avatarUrlValue}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full border border-[var(--border)] object-cover bg-[var(--bg)]"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    unoptimized
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
            </div>

            <div className={activeEditorSection === "links" ? "block space-y-3" : "hidden"}>
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
              <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
                <p className="text-xs font-medium text-[var(--muted)] mb-2">Short links (URL shortener)</p>
                <p className="text-[10px] text-[var(--muted)] mb-2">
                  <code className="rounded bg-[var(--bg)]/80 px-1">/{profile.slug}/SLUG</code> will redirect to a URL you set (e.g. <code className="rounded bg-[var(--bg)]/80 px-1">twitch</code> → your Twitch).
                </p>
                {shortLinks.length > 0 && (
                  <ul className="space-y-2 mb-3">
                    {shortLinks.map((link) => (
                      <li
                        key={link.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)]/60 bg-[var(--bg)]/60 px-2 py-2"
                      >
                        <code className="text-xs text-[var(--accent)]">/{profile.slug}/{link.slug}</code>
                        <span className="text-[10px] text-[var(--muted)]">→</span>
                        <span className="text-xs text-[var(--muted)] truncate max-w-[180px]" title={link.url}>{link.url}</span>
                        <button
                          type="button"
                          onClick={() => setShortLinkToDelete(link)}
                          className="ml-auto shrink-0 rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--warning)]"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {shortLinkError && <p className="text-xs text-[var(--warning)] mb-2">{shortLinkError}</p>}
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs font-medium text-[var(--muted)]">
                    Slug
                    <input
                      type="text"
                      value={shortLinkSlug}
                      onChange={(e) => { setShortLinkSlug(e.target.value); setShortLinkError(null); }}
                      placeholder="twitch"
                      className="mt-0.5 block w-24 rounded border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
                    URL
                    <input
                      type="url"
                      value={shortLinkUrl}
                      onChange={(e) => { setShortLinkUrl(e.target.value); setShortLinkError(null); }}
                      placeholder="https://…"
                      className="mt-0.5 block w-full rounded border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!shortLinkSlug.trim() || !shortLinkUrl.trim() || shortLinkAdding}
                    onClick={async () => {
                      setShortLinkError(null);
                      setShortLinkAdding(true);
                      const result = await addShortLinkAction(profile.id, { slug: shortLinkSlug.trim(), url: shortLinkUrl.trim() });
                      setShortLinkAdding(false);
                      if (result.error) setShortLinkError(result.error);
                      else if (result.id != null && result.slug != null && result.url != null) {
                        const { id, slug, url } = result;
                        setShortLinks((prev) => [...prev, { id, slug, url }]);
                        setShortLinkSlug("");
                        setShortLinkUrl("");
                        toast.success("Short link added");
                      }
                    }}
                    className="rounded border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
                  >
                    {shortLinkAdding ? "Adding…" : "Add short link"}
                  </button>
                </div>
              </div>
            </div>

            <div
              className={
                activeEditorSection === "banner"
                  ? "flex min-h-[min(70vh,800px)] flex-col gap-3"
                  : "hidden"
              }
            >
              <p className="text-xs font-medium text-[var(--muted)] shrink-0">ASCII banner and options</p>
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
                  <span className="shrink-0">ASCII banner <span className="text-[var(--muted)]/70">(optional, shown at top of profile)</span></span>
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

            <div className={activeEditorSection === "terminal" ? "block space-y-3" : "hidden"}>
              <p className="text-xs font-medium text-[var(--muted)] mb-1">Show your profile as a terminal with custom commands (like the homepage)</p>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  name="useTerminalLayout"
                  defaultChecked={profile.useTerminalLayout ?? false}
                  className="rounded border-[var(--border)]"
                />
                Enable terminal commands
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

            <div className={activeEditorSection === "display" ? "block space-y-3" : "hidden"}>
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
                Display page views <span className="text-[var(--muted)]/70">(on profile and in dashboard logs)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                <input type="checkbox" name="showDiscordBadges" defaultChecked={profile.showDiscordBadges ?? false} className="rounded border-[var(--border)]" />
                Show my Discord badges on profile <span className="text-[var(--muted)]/70">(Staff, Partner, HypeSquad, etc.)</span>
              </label>
            </div>

            <div className={activeEditorSection === "fun" ? "block space-y-3" : "hidden"}>
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
                Box opacity
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="range"
                    name="cardOpacity"
                    min={50}
                    max={100}
                    value={cardOpacityValue}
                    onChange={(e) => setCardOpacityValue(parseInt(e.target.value, 10))}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-[var(--border)] accent-[var(--accent)]"
                  />
                  <span className="text-xs text-[var(--muted)] w-10 tabular-nums">
                    {cardOpacityValue}%
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">Lower = more transparent. Default 95%.</p>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Font
                <select
                  name="customFont"
                  value={customFontValue}
                  onChange={(e) => { setCustomFontValue(e.target.value); if (e.target.value !== "custom") setCustomFontUrlValue(""); }}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Default (JetBrains Mono)</option>
                  <option value="jetbrains-mono">JetBrains Mono</option>
                  <option value="fira-code">Fira Code</option>
                  <option value="space-mono">Space Mono</option>
                  <option value="custom">Custom (upload)</option>
                </select>
                {customFontValue === "custom" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="customFontUrl" value={customFontUrlValue} />
                    <input
                      ref={customFontFileRef}
                      type="file"
                      accept=".ttf,.otf,.woff,font/ttf,font/otf,font/woff"
                      className="sr-only"
                      aria-hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          setCustomFontUploadError("Font must be 5 MB or smaller");
                          e.target.value = "";
                          return;
                        }
                        setCustomFontUploadError(null);
                        setCustomFontUploading(true);
                        try {
                          const form = new FormData();
                          form.append("file", file);
                          form.append("purpose", "font");
                          const res = await fetch("/api/upload", { method: "POST", body: form });
                          const data = await res.json();
                          if (!res.ok) setCustomFontUploadError(data.error ?? "Upload failed");
                          else {
                            const base = typeof window !== "undefined" ? window.location.origin : "";
                            setCustomFontUrlValue(data.url?.startsWith("http") ? data.url : `${base}${data.url || ""}`);
                          }
                        } finally {
                          setCustomFontUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => customFontFileRef.current?.click()}
                      disabled={customFontUploading}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
                    >
                      <UploadSimple size={16} weight="regular" />
                      {customFontUploading ? "Uploading…" : "Upload .ttf, .otf, .woff"}
                    </button>
                    {customFontUploadError && <p className="text-xs text-[var(--warning)]">{customFontUploadError}</p>}
                  </div>
                )}
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Cursor <span className="text-[var(--muted)]/70">(when viewing your profile)</span>
                <select
                  name="cursorStyle"
                  value={cursorStyleValue}
                  onChange={(e) => { setCursorStyleValue(e.target.value); if (e.target.value !== "custom") setCursorImageUrlValue(""); }}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="default">Default</option>
                  <option value="crosshair">Crosshair</option>
                  <option value="pointer">Pointer</option>
                  <option value="text">Text</option>
                  <option value="grab">Grab</option>
                  <option value="minimal">Minimal (dot)</option>
                  <option value="beam">Beam (terminal)</option>
                  <option value="custom">Custom (upload)</option>
                </select>
                {cursorStyleValue === "custom" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="cursorImageUrl" value={cursorImageUrlValue} />
                    <input
                      ref={cursorFileRef}
                      type="file"
                      accept=".cur,.png,.jpg,.jpeg,.gif,.webp,image/x-icon,image/png,image/jpeg,image/gif,image/webp"
                      className="sr-only"
                      aria-hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          setCursorUploadError("Cursor must be 5 MB or smaller");
                          e.target.value = "";
                          return;
                        }
                        setCursorUploadError(null);
                        setCursorUploading(true);
                        try {
                          const form = new FormData();
                          form.append("file", file);
                          form.append("purpose", "cursor");
                          const res = await fetch("/api/upload", { method: "POST", body: form });
                          const data = await res.json();
                          if (!res.ok) setCursorUploadError(data.error ?? "Upload failed");
                          else {
                            const base = typeof window !== "undefined" ? window.location.origin : "";
                            setCursorImageUrlValue(data.url?.startsWith("http") ? data.url : `${base}${data.url || ""}`);
                          }
                        } finally {
                          setCursorUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => cursorFileRef.current?.click()}
                      disabled={cursorUploading}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
                    >
                      <UploadSimple size={16} weight="regular" />
                      {cursorUploading ? "Uploading…" : "Upload .cur, .png, .jpg, .gif, .webp"}
                    </button>
                    {cursorUploadError && <p className="text-xs text-[var(--warning)]">{cursorUploadError}</p>}
                  </div>
                )}
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Animations
                <select
                  name="animationPreset"
                  defaultValue={(profile as { animationPreset?: string }).animationPreset ?? "none"}
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="none">None</option>
                  <optgroup label="Entrance">
                    <option value="fade-in">Fade in</option>
                    <option value="slide-up">Slide up</option>
                    <option value="scale-in">Scale in</option>
                    <option value="bounce-in">Bounce in</option>
                    <option value="flip-in">Flip in</option>
                    <option value="slide-in-left">Slide in from left</option>
                    <option value="zoom-bounce">Zoom bounce</option>
                    <option value="blur-in">Blur in</option>
                    <option value="neon-glow">Neon glow</option>
                    <option value="drift-in">Drift in</option>
                    <option value="stagger">Stagger cascade</option>
                  </optgroup>
                  <optgroup label="Ongoing / Hover">
                    <option value="float">Gentle float</option>
                    <option value="pulse-border">Pulse border</option>
                    <option value="glow">Glow on hover</option>
                    <option value="shimmer">Shimmer on links</option>
                  </optgroup>
                </select>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">Entrance animations play on load. Ongoing/hover effects add ambient motion.</p>
              </label>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Custom background <span className="text-[var(--muted)]/70">(image, video, or audio behind profile)</span>
                </label>
                <input type="hidden" name="backgroundType" value={backgroundTypeValue === "none" ? "" : backgroundTypeValue} />
                <input type="hidden" name="backgroundUrl" value={backgroundTypeValue === "none" ? "" : backgroundUrlValue} />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      checked={backgroundTypeValue === "none"}
                      onChange={() => {
                        setBackgroundTypeValue("none");
                        setBackgroundUrlValue("");
                        setBackgroundUploadError(null);
                      }}
                      className="rounded border-[var(--border)]"
                    />
                    None
                  </label>
                  <input
                    ref={backgroundFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/x-m4v,video/webm,video/quicktime,video/x-matroska,audio/mpeg,audio/mp3,audio/aac"
                    className="sr-only"
                    aria-hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const type = file.type?.toLowerCase().split(";")[0]?.trim();
                      const isVideo = type && BACKGROUND_VIDEO_TYPES.includes(type);
                      const isImage = type && BACKGROUND_IMAGE_TYPES.includes(type);
                      const isAudio = type && BACKGROUND_AUDIO_TYPES.includes(type);
                      if (!isImage && !isVideo && !isAudio) {
                        setBackgroundUploadError("Use PNG, JPG, GIF, WebP, MP4, M4V, WebM, MOV, MKV, MP3, or AAC");
                        e.target.value = "";
                        return;
                      }
                      if (isVideo && file.size > 100 * 1024 * 1024) {
                        setBackgroundUploadError("Video must be 100 MB or smaller");
                        e.target.value = "";
                        return;
                      }
                      if (isImage && file.size > 100 * 1024 * 1024) {
                        setBackgroundUploadError("Image must be 100 MB or smaller");
                        e.target.value = "";
                        return;
                      }
                      if (isAudio && file.size > 10 * 1024 * 1024) {
                        setBackgroundUploadError("Audio must be 10 MB or smaller");
                        e.target.value = "";
                        return;
                      }
                      setBackgroundUploadError(null);
                      setBackgroundUploading(true);
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        if (isVideo) form.append("purpose", "background-video");
                        else if (isImage) form.append("purpose", "background-image");
                        else if (isAudio) form.append("purpose", "background-audio");
                        const prevUrl = backgroundUrlValue.trim();
                        if (prevUrl && prevUrl.includes("/api/files/")) {
                          const match = prevUrl.match(/\/api\/files\/(\d+,\d+)/);
                          if (match) form.append("replaceFid", match[1]);
                        }
                        const res = await fetch("/api/upload", { method: "POST", body: form });
                        const data = await res.json();
                        if (!res.ok) {
                          setBackgroundUploadError(data.error ?? "Upload failed");
                        } else {
                          const base = typeof window !== "undefined" ? window.location.origin : "";
                          const url = data.url?.startsWith("http") ? data.url : `${base}${data.url || ""}`;
                          setBackgroundTypeValue(isVideo ? "video" : isAudio ? "audio" : "image");
                          setBackgroundUrlValue(url);
                        }
                      } finally {
                        setBackgroundUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => backgroundFileInputRef.current?.click()}
                    disabled={backgroundUploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-medium text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
                  >
                    <UploadSimple size={16} weight="regular" />
                    {backgroundUploading ? "Uploading…" : "Upload a file"}
                  </button>
                </div>
                {backgroundTypeValue !== "none" && backgroundUrlValue && (
                  <p className="text-[10px] text-[var(--muted)]">
                    {backgroundTypeValue === "image" ? "Image" : backgroundTypeValue === "video" ? "Video" : "Audio"} set. Upload again to replace (old file removed), or None to remove.
                  </p>
                )}
                {backgroundUploadError && (
                  <p className="text-[10px] text-[var(--warning)]">{backgroundUploadError}</p>
                )}
                <p className="text-[10px] text-[var(--muted)]">
                  Images/video: PNG, JPG, GIF, WebP, MP4, M4V, WebM, MOV, MKV (max 100 MB). Audio: MP3, AAC (max 10 MB). Media uses a &quot;Click to view profile&quot; overlay.
                </p>
              </div>
            </div>

            <div className={activeEditorSection === "audio" ? "block space-y-4" : "hidden"}>
              <div className="rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/30 px-3 py-2">
                <p className="text-xs text-[var(--muted)] mb-3">
                  An audio player widget will be displayed on your profile where visitors can control your tracks.
                </p>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    name="showAudioPlayer"
                    checked={showAudioPlayerValue}
                    onChange={(e) => setShowAudioPlayerValue(e.target.checked)}
                    className="rounded border-[var(--border)]"
                  />
                  Audio Player
                </label>
              </div>
              {showAudioPlayerValue && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--muted)]">Tracks</p>
                  <input type="hidden" name="audioTracks" value={JSON.stringify(audioTracksValue)} />
                  <ul className="space-y-2">
                    {audioTracksValue.map((track, i) => (
                      <li
                        key={`${track.url}-${i}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 px-3 py-2 text-sm"
                      >
                        <span className="truncate min-w-0" title={track.url}>
                          {track.title || `Track ${i + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAudioTracksValue((prev) => prev.filter((_, j) => j !== i))}
                          className="shrink-0 rounded p-1 text-[var(--muted)] hover:bg-[var(--warning)]/20 hover:text-[var(--warning)] transition-colors"
                          aria-label="Remove track"
                        >
                          <Trash size={16} weight="regular" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={audioTrackFileRef}
                      type="file"
                      accept=".mp3,.aac,audio/mpeg,audio/mp3,audio/aac"
                      className="sr-only"
                      aria-hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          setAudioTrackUploadError("Track must be 10 MB or smaller");
                          e.target.value = "";
                          return;
                        }
                        setAudioTrackUploadError(null);
                        setAudioTrackUploading(true);
                        try {
                          const form = new FormData();
                          form.append("file", file);
                          form.append("purpose", "audio-player");
                          const res = await fetch("/api/upload", { method: "POST", body: form });
                          const data = await res.json();
                          if (!res.ok) {
                            setAudioTrackUploadError(data.error ?? "Upload failed");
                          } else {
                            const base = typeof window !== "undefined" ? window.location.origin : "";
                            const url = data.url?.startsWith("http") ? data.url : `${base}${data.url || ""}`;
                            setAudioTracksValue((prev) => [...prev, { url, title: file.name.replace(/\.[^.]*$/, "") || undefined }]);
                          }
                        } finally {
                          setAudioTrackUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => audioTrackFileRef.current?.click()}
                      disabled={audioTrackUploading}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-medium text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
                    >
                      <UploadSimple size={16} weight="regular" />
                      {audioTrackUploading ? "Uploading…" : "Add track"}
                    </button>
                  </div>
                  {audioTrackUploadError && (
                    <p className="text-xs text-[var(--warning)]">{audioTrackUploadError}</p>
                  )}
                  <p className="text-[10px] text-[var(--muted)]">
                    MP3 or AAC, max 10 MB per track.
                  </p>
                </div>
              )}
            </div>

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

      {templateModal && (
        <TemplateConfirmModal
          template={templateModal}
          onClose={() => setTemplateModal(null)}
          onConfirm={async () => {
            setTemplateApplying(true);
            const result = await applyTemplateAction(profile.id, templateModal.id);
            setTemplateApplying(false);
            if (result.error) {
              toast.error(result.error);
            } else {
              setTemplateModal(null);
              toast.success("Template applied");
              router.refresh();
            }
          }}
          applying={templateApplying}
        />
      )}

      <ConfirmDialog
        open={shortLinkToDelete != null}
        title="Remove short link?"
        message={shortLinkToDelete ? `/${profile.slug}/${shortLinkToDelete.slug} will no longer redirect.` : ""}
        confirmLabel="Remove"
        variant="danger"
        loading={shortLinkDeleting}
        onConfirm={async () => {
          if (!shortLinkToDelete) return;
          setShortLinkDeleting(true);
          setShortLinkError(null);
          const result = await deleteShortLinkAction(shortLinkToDelete.id);
          setShortLinkDeleting(false);
          if (result.error) {
            setShortLinkError(result.error);
            toast.error(result.error);
          } else {
            setShortLinks((prev) => prev.filter((l) => l.id !== shortLinkToDelete.id));
            setShortLinkToDelete(null);
            toast.success("Short link removed");
          }
        }}
        onCancel={() => setShortLinkToDelete(null)}
      />
    </div>
  );
}
