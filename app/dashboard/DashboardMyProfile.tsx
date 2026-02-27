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
  UploadSimple,
  DiscordLogo,
  MusicNotes,
  Trash,
  VideoCamera,
  X,
  Play,
  DotsSixVertical,
  GridFour,
  ListChecks,
  Snowflake,
  CloudRain,
  CircleHalf,
  Monitor,
  Sparkle,
  Square,
  SquaresFour,
  ClockCounterClockwise,
  ArrowCounterClockwise,
  FloppyDisk,
  CalendarBlank,
  Buildings,
  ArrowSquareOut,
  Lock,
  Crown,
} from "@phosphor-icons/react";
import { useActionState, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import SearchableSelect from "@/app/components/SearchableSelect";
import type { ProfileRow } from "@/lib/db/schema";
import {
  updateProfileAction,
  saveProfileVersionAction,
  restoreProfileVersionAction,
  deleteProfileVersionAction,
  type ProfileFormState,
} from "@/app/dashboard/actions";
import { normalizeSlug, SLUG_MAX_LENGTH } from "@/lib/slug";
import type { ProfileVersionRow } from "@/lib/profile-versions";
import { ACCENT_COLOR_OPTIONS, ACCENT_COLORS, BANNER_STYLE_OPTIONS, isValidHexColor } from "@/lib/profile-themes";
import { getDiscordBadgeInfo } from "@/lib/discord-badges";
import DiscordWidgetsDisplay, { normalizeWidgetData } from "@/app/components/DiscordWidgetsDisplay";
import RobloxWidgetsDisplay from "@/app/components/RobloxWidgetsDisplay";
import DashboardLinks from "@/app/dashboard/DashboardLinks";
import type { DiscordWidgetData } from "@/lib/discord-widgets";
import type { Profile } from "@/lib/profiles";

const dashIcon = { size: 18, weight: "regular" as const, className: "shrink-0" };
const PREVIEW_STORAGE_KEY = "dread-preview-profile";
const PREVIEW_MESSAGE_TYPE = "dread-preview-update";
const TAGLINE_MAX = 120;
const DESCRIPTION_MAX = 2000;

type EditorSectionId = "basics" | "discord" | "extras" | "links" | "banner" | "terminal" | "fun" | "widgets" | "audio" | "versions";
const EDITOR_SECTIONS: { id: EditorSectionId; label: string; icon: React.ReactNode }[] = [
  { id: "basics", label: "Basics", icon: <Notebook {...dashIcon} aria-hidden /> },
  { id: "extras", label: "Extras", icon: <ListChecks {...dashIcon} aria-hidden /> },
  { id: "discord", label: "Discord", icon: <DiscordLogo {...dashIcon} aria-hidden /> },
  { id: "links", label: "Links", icon: <LinkIcon {...dashIcon} aria-hidden /> },
  { id: "banner", label: "Text art", icon: <ImageIcon {...dashIcon} aria-hidden /> },
  { id: "terminal", label: "Terminal", icon: <Terminal {...dashIcon} aria-hidden /> },
  { id: "fun", label: "Styling", icon: <SlidersHorizontal {...dashIcon} aria-hidden /> },
  { id: "widgets", label: "Widgets", icon: <SquaresFour {...dashIcon} aria-hidden /> },
  { id: "audio", label: "Audio Player", icon: <MusicNotes {...dashIcon} aria-hidden /> },
  { id: "versions", label: "Versions", icon: <ClockCounterClockwise {...dashIcon} aria-hidden /> },
];

const MAX_WIDGETS = 4;


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
interface DashboardMyProfileProps {
  profile: ProfileRow;
  /** Base profile for live preview (from memberProfileToProfile). */
  baseProfileForPreview?: Profile;
  /** Saved profile versions (up to 5). */
  versions?: ProfileVersionRow[];
  /** Current user's Discord avatar URL (from session), for "Use Discord avatar" button. */
  discordAvatarUrl?: string | null;
  /** Discord badge keys this user has (for per-badge visibility toggles). */
  availableDiscordBadges?: string[];
  /** Pre-fetched widget data for live preview (dates may arrive as ISO strings). */
  widgetPreviewData?: DiscordWidgetData | null;
  /** Whether the user has linked their Roblox account via OAuth. */
  robloxLinked?: boolean;
  /** Whether the user has Premium (for gating effects, colors, analytics). */
  hasPremiumAccess?: boolean;
}

/** Grouped IANA timezones for local time display. */
const TIMEZONE_GROUPS: { label: string; zones: string[] }[] = [
  { label: "Americas", zones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "America/Phoenix", "America/Toronto", "America/Vancouver", "America/Montreal", "America/Mexico_City", "America/Sao_Paulo", "America/Buenos_Aires"] },
  { label: "Europe", zones: ["Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Amsterdam", "Europe/Dublin", "Europe/Madrid", "Europe/Rome", "Europe/Stockholm", "Europe/Copenhagen", "Europe/Warsaw", "Europe/Prague", "Europe/Vienna", "Europe/Zurich", "Europe/Athens", "Europe/Helsinki", "Europe/Istanbul"] },
  { label: "Asia / Pacific", zones: ["Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Bangkok", "Asia/Kolkata", "Asia/Dubai", "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland"] },
];

const TIMEZONE_SELECT_GROUPS = TIMEZONE_GROUPS.map((g) => ({
  label: g.label,
  options: g.zones.map((tz) => ({ value: tz, label: tz.replace(/_/g, " ") })),
}));

function SubmitButton({ onRevert }: { onRevert?: () => void }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 pt-6 pb-2 -mb-2 flex items-center gap-3 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)] to-transparent">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/20 px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] disabled:opacity-50 disabled:pointer-events-none"
      >
        <FloppyDisk size={18} weight="regular" />
        {pending ? "Saving…" : "Save changes"}
      </button>
      {onRevert && (
        <button
          type="button"
          onClick={onRevert}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--border)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] disabled:opacity-50 disabled:pointer-events-none"
        >
          <ArrowCounterClockwise size={18} weight="regular" />
          Revert changes
        </button>
      )}
      <span className="text-xs text-[var(--muted)]">⌘/Ctrl+Enter to save</span>
    </div>
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

function ProfileVersionsPanel({
  profileId,
  versions,
  onSaved,
  onRestored,
  onDeleted,
}: {
  profileId: string;
  versions: ProfileVersionRow[];
  onSaved: () => void;
  onRestored: () => void;
  onDeleted: () => void;
}) {
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSave = useCallback(async () => {
    const name = saveName.trim();
    if (!name) {
      setSaveError("Enter a name for this version");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const result = await saveProfileVersionAction(profileId, name);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaveName("");
        toast.success("Version saved");
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }, [profileId, saveName, onSaved]);

  const handleRestore = useCallback(async () => {
    if (!restoreId) return;
    setRestoring(true);
    try {
      const result = await restoreProfileVersionAction(restoreId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile restored");
        setRestoreId(null);
        onRestored();
      }
    } finally {
      setRestoring(false);
    }
  }, [restoreId, onRestored]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const result = await deleteProfileVersionAction(deleteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Version deleted");
        setDeleteId(null);
        onDeleted();
      }
    } finally {
      setDeleting(false);
    }
  }, [deleteId, onDeleted]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value.slice(0, 80))}
          placeholder="e.g. Summer 2025"
          maxLength={80}
          className="flex-1 min-w-[12rem] rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          <FloppyDisk size={16} weight="regular" />
          {saving ? "Saving…" : "Save current"}
        </button>
      </div>
      {saveError && <p className="text-xs text-[var(--warning)]">{saveError}</p>}
      {versions.length > 0 ? (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-[var(--foreground)] truncate block">{v.name}</span>
                <span className="text-[10px] text-[var(--muted)]">
                  {new Date(v.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setRestoreId(v.id)}
                  className="rounded p-2 text-[var(--muted)] hover:bg-[var(--accent)]/15 hover:text-[var(--accent)] transition-colors"
                  title="Restore"
                  aria-label={`Restore ${v.name}`}
                >
                  <ArrowCounterClockwise size={16} weight="regular" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(v.id)}
                  className="rounded p-2 text-[var(--muted)] hover:bg-[var(--warning)]/15 hover:text-[var(--warning)] transition-colors"
                  title="Delete"
                  aria-label={`Delete ${v.name}`}
                >
                  <Trash size={16} weight="regular" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--muted)]">No saved versions yet. Save your current profile above.</p>
      )}

      <ConfirmDialog
        open={restoreId !== null}
        title="Restore this version?"
        message="Your current profile will be replaced. Make sure to save any unsaved changes in the Editor first."
        confirmLabel="Restore"
        variant="default"
        loading={restoring}
        onConfirm={handleRestore}
        onCancel={() => setRestoreId(null)}
      />
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this version?"
        message="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}

type DashboardTab = "editor" | "preview";

export default function DashboardMyProfile({
  profile,
  baseProfileForPreview,
  versions: initialVersions = [],
  discordAvatarUrl,
  availableDiscordBadges = [],
  widgetPreviewData = null,
  robloxLinked = false,
  hasPremiumAccess = false,
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
  const [avatarUrlValue, setAvatarUrlValue] = useState(profile.avatarUrl ?? "");
  const [slugCheck, setSlugCheck] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [activeEditorSection, setActiveEditorSection] = useState<EditorSectionId>("basics");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const BG_OPTIONS = ["grid", "gradient", "solid", "dither", "image", "video"] as const;
  const [backgroundTypeValue, setBackgroundTypeValue] = useState<string>(() => {
    const t = (profile as { backgroundType?: string }).backgroundType ?? "grid";
    return ["image", "video", "grid", "gradient", "solid", "dither"].includes(t) ? t : "grid";
  });
  const [backgroundUrlValue, setBackgroundUrlValue] = useState(() => {
    const t = (profile as { backgroundType?: string }).backgroundType ?? "grid";
    return ["image", "video"].includes(t) ? ((profile as { backgroundUrl?: string }).backgroundUrl ?? "") : "";
  });
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [backgroundUploadError, setBackgroundUploadError] = useState<string | null>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const [backgroundAudioUrlValue, setBackgroundAudioUrlValue] = useState(() => {
    const audio = (profile as { backgroundAudioUrl?: string }).backgroundAudioUrl?.trim();
    if (audio) return audio;
    const t = (profile as { backgroundType?: string }).backgroundType ?? "";
    return t === "audio" ? ((profile as { backgroundUrl?: string }).backgroundUrl ?? "") : "";
  });
  const [backgroundAudioUploading, setBackgroundAudioUploading] = useState(false);
  const [backgroundAudioUploadError, setBackgroundAudioUploadError] = useState<string | null>(null);
  const backgroundAudioFileRef = useRef<HTMLInputElement>(null);
  const [backgroundDragOver, setBackgroundDragOver] = useState(false);
  const [audioDragOver, setAudioDragOver] = useState(false);
  const BG_EFFECT_OPTIONS = ["none", "snow", "rain", "blur", "retro-computer"] as const;
  const [backgroundEffectValue, setBackgroundEffectValue] = useState<string>(() => {
    const v = (profile as { backgroundEffect?: string }).backgroundEffect ?? "";
    return BG_EFFECT_OPTIONS.includes(v as (typeof BG_EFFECT_OPTIONS)[number]) ? v : "none";
  });

  const [widgetAccountAge, setWidgetAccountAge] = useState(() =>
    (profile as { showDiscordWidgets?: string }).showDiscordWidgets?.includes("accountAge") ?? false
  );
  const [widgetJoined, setWidgetJoined] = useState(() =>
    (profile as { showDiscordWidgets?: string }).showDiscordWidgets?.includes("joined") ?? false
  );
  const [widgetServerCount, setWidgetServerCount] = useState(() =>
    (profile as { showDiscordWidgets?: string }).showDiscordWidgets?.includes("serverCount") ?? false
  );
  const [widgetServerInvite, setWidgetServerInvite] = useState(() =>
    (profile as { showDiscordWidgets?: string }).showDiscordWidgets?.includes("serverInvite") ?? false
  );
  const [widgetRobloxAccountAge, setWidgetRobloxAccountAge] = useState(() =>
    (profile as { showRobloxWidgets?: string }).showRobloxWidgets?.includes("accountAge") ?? false
  );
  const [widgetRobloxProfile, setWidgetRobloxProfile] = useState(() =>
    (profile as { showRobloxWidgets?: string }).showRobloxWidgets?.includes("profile") ?? false
  );
  const [widgetsMatchAccent, setWidgetsMatchAccent] = useState(() =>
    (profile as { widgetsMatchAccent?: boolean }).widgetsMatchAccent ?? false
  );
  const [discordInviteInput, setDiscordInviteInput] = useState(
    (profile as { discordInviteUrl?: string }).discordInviteUrl ?? ""
  );
  const widgetCount =
    [widgetAccountAge, widgetJoined, widgetServerCount, widgetServerInvite, widgetRobloxAccountAge, widgetRobloxProfile].filter(Boolean).length;
  const canEnableMore = widgetCount < MAX_WIDGETS;

  const widgetPreviewFiltered = (() => {
    const raw = normalizeWidgetData(widgetPreviewData);
    const inviteUrl = discordInviteInput.trim();
    const hasValidInvite = inviteUrl && /^(https?:\/\/)?(discord\.gg\/|discord\.com\/invite\/)[a-zA-Z0-9-]+$|^[a-zA-Z0-9-]{2,32}$/.test(inviteUrl);
    const resolvedInviteUrl = hasValidInvite
      ? inviteUrl.startsWith("http")
        ? inviteUrl
        : `https://discord.gg/${inviteUrl.replace(/^(discord\.gg\/|discord\.com\/invite\/)/i, "")}`
      : null;
    const out: DiscordWidgetData = {};
    if (widgetAccountAge && raw?.accountAge) out.accountAge = raw.accountAge;
    if (widgetJoined && raw?.joined) out.joined = raw.joined;
    if (widgetServerCount && raw?.serverCount != null) out.serverCount = raw.serverCount;
    if (widgetServerInvite) {
      out.serverInvite = resolvedInviteUrl
        ? { url: resolvedInviteUrl, guildName: raw?.serverInvite?.guildName ?? "Your server" }
        : raw?.serverInvite ?? { url: "#", guildName: "Your server (add link below)" };
    }
    return Object.keys(out).length > 0 ? out : null;
  })();

  const handleBackgroundFileUpload = useCallback(async (file: File) => {
    const type = file.type?.toLowerCase().split(";")[0]?.trim();
    const isVideo = type && BACKGROUND_VIDEO_TYPES.includes(type);
    const isImage = type && BACKGROUND_IMAGE_TYPES.includes(type);
    if (!isImage && !isVideo) {
      setBackgroundUploadError("Use PNG, JPG, GIF, WebP, MP4, M4V, WebM, MOV, or MKV");
      return;
    }
    if (isVideo && file.size > 100 * 1024 * 1024) {
      setBackgroundUploadError("Video must be 100 MB or smaller");
      return;
    }
    if (isImage && file.size > 100 * 1024 * 1024) {
      setBackgroundUploadError("Image must be 100 MB or smaller");
      return;
    }
    setBackgroundUploadError(null);
    setBackgroundUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (isVideo) form.append("purpose", "background-video");
      else form.append("purpose", "background-image");
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
        setBackgroundTypeValue(isVideo ? "video" : "image");
        setBackgroundUrlValue(url);
      }
    } finally {
      setBackgroundUploading(false);
    }
  }, [backgroundUrlValue]);

  const handleBackgroundAudioUpload = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setBackgroundAudioUploadError("Audio must be 10 MB or smaller");
      return;
    }
    setBackgroundAudioUploadError(null);
    setBackgroundAudioUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "background-audio");
      const prevUrl = backgroundAudioUrlValue.trim();
      if (prevUrl && prevUrl.includes("/api/files/")) {
        const match = prevUrl.match(/\/api\/files\/(\d+,\d+)/);
        if (match) form.append("replaceFid", match[1]);
      }
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setBackgroundAudioUploadError(data.error ?? "Upload failed");
      } else {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const url = data.url?.startsWith("http") ? data.url : `${base}${data.url || ""}`;
        setBackgroundAudioUrlValue(url);
      }
    } finally {
      setBackgroundAudioUploading(false);
    }
  }, [backgroundAudioUrlValue]);
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
  const [audioVisualizerStyleValue, setAudioVisualizerStyleValue] = useState(() => {
    const s = (profile as { audioVisualizerStyle?: string }).audioVisualizerStyle;
    if (!s) return (profile as { showAudioVisualizer?: boolean }).showAudioVisualizer ? "bars" : "";
    const map: Record<string, string> = { waveform: "wave", circle: "bars", line: "bars", blocks: "bars" };
    return map[s] ?? (["bars", "wave", "spectrum"].includes(s) ? s : "");
  });
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
  const [audioTracksDragOver, setAudioTracksDragOver] = useState(false);
  const [editingTrackIndex, setEditingTrackIndex] = useState<number | null>(null);
  const [editingTrackTitle, setEditingTrackTitle] = useState("");
  const [draggedTrackIndex, setDraggedTrackIndex] = useState<number | null>(null);

  const handleAudioTrackUpload = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setAudioTrackUploadError("Track must be 10 MB or smaller");
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
    }
  }, []);

  const moveTrack = useCallback((from: number, to: number) => {
    setAudioTracksValue((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
  }, []);

  const [cardOpacityValue, setCardOpacityValue] = useState((profile as { cardOpacity?: number }).cardOpacity ?? 95);
  const [cardBlurValue, setCardBlurValue] = useState((profile as { cardBlur?: string }).cardBlur ?? "sm");
  const [cardEffectsEnabledValue, setCardEffectsEnabledValue] = useState((profile as { cardEffectsEnabled?: boolean }).cardEffectsEnabled ?? false);
  const slugCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
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

  // Ctrl+Enter / Cmd+Enter to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const form = document.getElementById("profile-editor-form") as HTMLFormElement | null;
        if (form && tab === "editor") form.requestSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tab]);

  const formKey = `${profile.id}-${(profile as { updatedAt?: Date }).updatedAt?.getTime?.() ?? 0}`;

  const previewProfile = useMemo(() => (baseProfileForPreview
    ? ({
        ...baseProfileForPreview,
        slug: slugValue || baseProfileForPreview.slug,
        tagline: taglineValue || undefined,
        description: descriptionValue,
        banner: bannerValue || undefined,
        avatar: avatarUrlValue || baseProfileForPreview.avatar,
        terminalCommands: terminalCommandEntries.filter((e) => e.command.trim() || e.output.trim()),
        backgroundType: ["grid", "gradient", "solid", "dither", "image", "video"].includes(backgroundTypeValue)
          ? backgroundTypeValue
          : baseProfileForPreview.backgroundType,
        backgroundUrl: ["image", "video"].includes(backgroundTypeValue) ? backgroundUrlValue || undefined : undefined,
        backgroundAudioUrl: backgroundAudioUrlValue?.trim() || undefined,
        backgroundEffect: backgroundEffectValue && backgroundEffectValue !== "none" ? backgroundEffectValue : undefined,
        cardOpacity: cardOpacityValue,
        cardBlur: ["none", "sm", "md", "lg"].includes(cardBlurValue) ? (cardBlurValue as "none" | "sm" | "md" | "lg") : baseProfileForPreview.cardBlur,
        cardEffectsEnabled: cardEffectsEnabledValue,
        widgetsMatchAccent: widgetsMatchAccent,
        discordWidgets: widgetPreviewFiltered ?? undefined,
        robloxWidgets:
          widgetRobloxAccountAge || widgetRobloxProfile
            ? {
                ...(widgetRobloxAccountAge && baseProfileForPreview.robloxWidgets?.accountAge
                  ? { accountAge: baseProfileForPreview.robloxWidgets.accountAge }
                  : {}),
                ...(widgetRobloxProfile && baseProfileForPreview.robloxWidgets?.profile
                  ? { profile: baseProfileForPreview.robloxWidgets.profile }
                  : {}),
              }
            : undefined,
        showAudioPlayer: showAudioPlayerValue,
        audioVisualizerStyle: audioVisualizerStyleValue || undefined,
        audioTracks: audioTracksValue.length > 0 ? audioTracksValue : undefined,
      } satisfies Profile)
    : null), [
    baseProfileForPreview,
    slugValue,
    taglineValue,
    descriptionValue,
    bannerValue,
    avatarUrlValue,
    terminalCommandEntries,
    backgroundTypeValue,
    backgroundUrlValue,
    backgroundAudioUrlValue,
    backgroundEffectValue,
    widgetsMatchAccent,
    cardOpacityValue,
    cardBlurValue,
    cardEffectsEnabledValue,
    widgetPreviewFiltered,
    widgetRobloxAccountAge,
    widgetRobloxProfile,
    showAudioPlayerValue,
    audioVisualizerStyleValue,
    audioTracksValue,
  ]);

  useEffect(() => {
    if (!previewProfile || typeof window === "undefined") return;
    try {
      sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(previewProfile));
      previewIframeRef.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE_TYPE }, window.location.origin);
    } catch {
      /* ignore */
    }
  }, [previewProfile]);

  const handleRevert = useCallback(() => {
    setSlugValue(profile.slug);
    setTaglineValue(profile.tagline ?? "");
    setDescriptionValue(profile.description);
    setBannerValue(profile.banner ?? "");
    setAvatarUrlValue(profile.avatarUrl ?? "");
    setTerminalCommandEntries(parseTerminalCommandsForEditor(profile.terminalCommands ?? null));
    setBackgroundTypeValue(
      ["image", "video", "grid", "gradient", "solid", "dither"].includes((profile as { backgroundType?: string }).backgroundType ?? "")
        ? (profile as { backgroundType?: string }).backgroundType ?? "grid"
        : "grid"
    );
    const bgType = (profile as { backgroundType?: string }).backgroundType ?? "";
    setBackgroundUrlValue(
      ["image", "video"].includes(bgType) ? ((profile as { backgroundUrl?: string }).backgroundUrl ?? "") : ""
    );
    const audio = (profile as { backgroundAudioUrl?: string }).backgroundAudioUrl?.trim();
    setBackgroundAudioUrlValue(audio ?? (bgType === "audio" ? ((profile as { backgroundUrl?: string }).backgroundUrl ?? "") : ""));
    const eff = (profile as { backgroundEffect?: string }).backgroundEffect ?? "";
    setBackgroundEffectValue(BG_EFFECT_OPTIONS.includes(eff as (typeof BG_EFFECT_OPTIONS)[number]) ? eff : "none");
    setWidgetAccountAge((profile as { showDiscordWidgets?: string }).showDiscordWidgets?.includes("accountAge") ?? false);
    setWidgetJoined((profile as { showDiscordWidgets?: string }).showDiscordWidgets?.includes("joined") ?? false);
    setWidgetServerCount((profile as { showDiscordWidgets?: string }).showDiscordWidgets?.includes("serverCount") ?? false);
    setWidgetServerInvite((profile as { showDiscordWidgets?: string }).showDiscordWidgets?.includes("serverInvite") ?? false);
    setDiscordInviteInput((profile as { discordInviteUrl?: string }).discordInviteUrl ?? "");
    setWidgetRobloxAccountAge((profile as { showRobloxWidgets?: string }).showRobloxWidgets?.includes("accountAge") ?? false);
    setWidgetRobloxProfile((profile as { showRobloxWidgets?: string }).showRobloxWidgets?.includes("profile") ?? false);
    setWidgetsMatchAccent((profile as { widgetsMatchAccent?: boolean }).widgetsMatchAccent ?? false);
    setCardOpacityValue((profile as { cardOpacity?: number }).cardOpacity ?? 95);
    setCardBlurValue((profile as { cardBlur?: string }).cardBlur ?? "sm");
    setCardEffectsEnabledValue((profile as { cardEffectsEnabled?: boolean }).cardEffectsEnabled ?? false);
    setCustomFontValue((() => {
      const p = profile as { customFont?: string; customFontUrl?: string };
      return p.customFontUrl ? "custom" : (p.customFont ?? "");
    })());
    setCustomFontUrlValue((profile as { customFontUrl?: string }).customFontUrl ?? "");
    setCursorStyleValue((() => {
      const p = profile as { cursorStyle?: string; cursorImageUrl?: string };
      return p.cursorImageUrl ? "custom" : (p.cursorStyle ?? "default");
    })());
    setCursorImageUrlValue((profile as { cursorImageUrl?: string }).cursorImageUrl ?? "");
    setShowAudioPlayerValue((profile as { showAudioPlayer?: boolean }).showAudioPlayer ?? false);
    const audioVizStyle = (() => {
      const s = (profile as { audioVisualizerStyle?: string }).audioVisualizerStyle;
      if (!s) return (profile as { showAudioVisualizer?: boolean }).showAudioVisualizer ? "bars" : "";
      const map: Record<string, string> = { waveform: "wave", circle: "bars", line: "bars", blocks: "bars" };
      return map[s] ?? (["bars", "wave", "spectrum"].includes(s) ? s : "");
    })();
    setAudioVisualizerStyleValue(audioVizStyle);
    const audioTracks = (() => {
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
    })();
    setAudioTracksValue(audioTracks);
    setSlugCheck("idle");
    const form = document.getElementById("profile-editor-form") as HTMLFormElement | null;
    if (form) form.reset();
    toast.success("Changes reverted");
  }, [profile]);

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden xl:h-[calc(100vh-6rem)]">
      {/* Tabs only on smaller screens; xl+ shows side-by-side */}
      <nav
        className="xl:hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden shrink-0 mb-4"
        aria-label="Profile editor"
      >
        <div className="flex">
          <TabButton active={tab === "editor"} onClick={() => setTab("editor")} icon={<PencilSimple {...dashIcon} />}>
            Editor
          </TabButton>
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")} icon={<Eye {...dashIcon} />}>
            Preview
          </TabButton>
        </div>
      </nav>

      {/* Side-by-side layout on xl; stacked on smaller */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden xl:flex-row xl:gap-4">
        {/* Editor panel - full width on <xl, left half on xl+ */}
        <section
          className={`animate-dashboard-panel flex flex-1 flex-col min-h-0 xl:flex-[1.2] rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm ${
            tab === "preview" ? "hidden xl:flex" : ""
          } xl:min-w-0`}
          aria-label="Profile editor"
        >
          <div className="border-b border-[var(--border)] px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-[var(--bg)]/80 shrink-0">
            <div className="flex items-center gap-2">
              <PencilSimple size={18} weight="regular" className="text-[var(--accent)]" aria-hidden />
              <span className="text-sm font-medium text-[var(--foreground)]">Editor</span>
              <span className="text-xs text-[var(--muted)] hidden sm:inline">— edit your profile</span>
            </div>
            <Link
              href={`/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
            >
              <ArrowSquareOut size={14} weight="regular" />
              Preview in new tab
            </Link>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[14rem_1fr] xl:grid-cols-[14rem_1fr]">
            <nav
              className="flex w-52 flex-col gap-1 overflow-hidden border-r border-[var(--border)] bg-[var(--bg)]/50 p-3 xl:w-56"
              aria-label="Editor sections"
            >
            {EDITOR_SECTIONS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveEditorSection(id)}
                aria-current={activeEditorSection === id ? "true" : undefined}
                className={`inline-flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeEditorSection === id
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                    : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
                }`}
              >
                {icon}
                <span className="truncate">{label}</span>
              </button>
            ))}
            <div className="mt-auto pt-4 border-t border-[var(--border)]">
              <Link
                href="/marketplace"
                className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)] transition-colors"
              >
                Browse templates →
              </Link>
            </div>
          </nav>
          <div className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-5 lg:p-6 overscroll-contain">
          {activeEditorSection === "links" ? (
            <DashboardLinks profile={profile} embedded />
          ) : (
          <form id="profile-editor-form" key={formKey} action={formAction} className="space-y-5 max-w-3xl">
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="terminalCommands" value={JSON.stringify(terminalCommandEntries.filter((e) => e.command.trim() || e.output.trim()))} />
            <div className={activeEditorSection === "basics" ? "block space-y-6" : "hidden"}>
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
                    {avatarUrlValue && (
                      <NextImage
                        src={avatarUrlValue}
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

            <div className={activeEditorSection === "discord" ? "block space-y-4" : "hidden"}>
              {/* Discord badges */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                  <div className="rounded-lg bg-[#5865F2]/10 p-1.5">
                    <DiscordLogo size={18} weight="fill" className="text-[#5865F2]" aria-hidden />
                  </div>
                  <span className="text-sm font-medium text-[var(--foreground)]">Discord badges</span>
                </div>
                <div className="p-4 space-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--foreground)]">
                    <input type="checkbox" name="showDiscordBadges" defaultChecked={profile.showDiscordBadges ?? false} className="rounded border-[var(--border)]" />
                    Show my Discord badges on profile <span className="text-[var(--muted)]/70">(Staff, Partner, HypeSquad, etc.)</span>
                  </label>
                  {availableDiscordBadges.length > 0 && (
                    <input type="hidden" name="availableDiscordBadgeKeys" value={availableDiscordBadges.join(",")} />
                  )}
                  {profile.showDiscordBadges && availableDiscordBadges.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1.5 rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/40 p-3">
                      <p className="text-xs font-medium text-[var(--muted)] mb-1.5">Choose which badges to show</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        {availableDiscordBadges.map((key) => {
                          const info = getDiscordBadgeInfo(key);
                          const hidden = (profile as { hiddenDiscordBadges?: string }).hiddenDiscordBadges
                            ?.split(",")
                            .map((s) => s.trim().toLowerCase())
                            .includes(key.toLowerCase());
                          return (
                            <label key={key} className="inline-flex items-center gap-2 cursor-pointer text-xs text-[var(--foreground)]">
                              <input
                                type="checkbox"
                                name={`showDiscordBadge_${key}`}
                                defaultChecked={!hidden}
                                className="rounded border-[var(--border)]"
                              />
                              {info?.label ?? key}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    ⚠️ Discord badge display is currently broken; some badges (e.g. Nitro) may not show reliably.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                  <div className="rounded-lg bg-[#5865F2]/10 p-1.5">
                    <DiscordLogo size={18} weight="fill" className="text-[#5865F2]" aria-hidden />
                  </div>
                  <span className="text-sm font-medium text-[var(--foreground)]">Discord presence</span>
                </div>
                <div className="p-4 space-y-2">
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
                    When enabled and you&apos;re in our Discord server, your live status (online/idle/busy) and Rich Presence (e.g. &quot;Playing X&quot;) appear on your profile.
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-xs text-[var(--warning)] rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2.5 py-1.5" role="note">
                    <span aria-hidden>⚠️</span>
                    You must be in the same Discord server as the bot for this to work.
                  </p>
                  <label className="block pt-2 text-xs font-medium text-[var(--muted)]">
                    Display style
                    <div className="mt-1">
                      <SearchableSelect
                        name="discordPresenceStyle"
                        defaultValue={(profile as { discordPresenceStyle?: string }).discordPresenceStyle ?? "widget"}
                        options={[
                          { value: "widget", label: "Widget — unified card (default)" },
                          { value: "pills", label: "Pills — status pill + activity pills" },
                          { value: "minimal", label: "Minimal — dot and compact text" },
                          { value: "stacked", label: "Stacked — status + activities as cards" },
                          { value: "inline", label: "Inline — single condensed row" },
                        ]}
                        searchThreshold={10}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className={activeEditorSection === "extras" ? "block space-y-4" : "hidden"}>
              <p className="text-xs font-medium text-[var(--muted)]">Quote, pronouns, tags, skills, availability, languages, and time info</p>
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
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  name="cardEffectsEnabled"
                  checked={cardEffectsEnabledValue}
                  onChange={(e) => setCardEffectsEnabledValue(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                Card effects <span className="text-[var(--muted)]/70">(3D tilt, spotlight, glare on hover)</span>
              </label>
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

            <div
              className={
                activeEditorSection === "banner"
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

            <div className={activeEditorSection === "fun" ? "block space-y-3" : "hidden"}>
              <p className="text-xs font-medium text-[var(--muted)] mb-1">Page theme, accent color, terminal prompt, greeting, card look</p>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Page theme
                <div className="mt-1">
                  <SearchableSelect
                    name="pageTheme"
                    defaultValue={(profile as { pageTheme?: string }).pageTheme ?? "classic-dark"}
                    options={[
                      { value: "classic-dark", label: "Classic — dark" },
                      { value: "classic-light", label: "Classic — light" },
                      { value: "minimalist-light", label: "Minimalist — light" },
                      { value: "minimalist-dark", label: "Minimalist — dark" },
                      { value: "professional-light", label: "Professional — light" },
                      { value: "professional-dark", label: "Professional — dark" },
                    ]}
                    searchThreshold={10}
                  />
                </div>
              </label>
              {!hasPremiumAccess && (
                <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3 flex items-center gap-3">
                  <Crown size={20} weight="fill" className="text-[var(--accent)] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Premium feature</p>
                    <p className="text-xs text-[var(--muted)]">Custom colors require Premium. <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">Upgrade</Link></p>
                  </div>
                </div>
              )}
              {hasPremiumAccess && (
              <label className="block text-xs font-medium text-[var(--muted)]">
                Accent color
                <div className="mt-1 space-y-2">
                  <SearchableSelect
                    name="accentColor"
                    defaultValue={
                      profile.accentColor && !isValidHexColor(profile.accentColor ?? undefined) ? profile.accentColor : ""
                    }
                    options={[
                      { value: "", label: "Default (cyan)" },
                      ...ACCENT_COLOR_OPTIONS,
                    ]}
                    searchPlaceholder="Search color…"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="accentColorCustom"
                      defaultValue={
                        ((): string => {
                          const ac = profile.accentColor ?? undefined;
                          return isValidHexColor(ac) ? ac : "";
                        })()
                      }
                      placeholder="#06b6d4"
                      maxLength={7}
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <input
                      type="color"
                      className="h-9 w-9 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0"
                      defaultValue={
                        isValidHexColor(profile.accentColor ?? undefined)
                          ? (profile.accentColor ?? "#06b6d4")
                          : profile.accentColor && profile.accentColor in ACCENT_COLORS
                            ? ACCENT_COLORS[profile.accentColor as keyof typeof ACCENT_COLORS]
                            : "#06b6d4"
                      }
                      onInput={(e) => {
                        const hex = (e.target as HTMLInputElement).value;
                        const text = (e.target as HTMLInputElement).form?.querySelector<HTMLInputElement>('input[name="accentColorCustom"]');
                        if (text) text.value = hex;
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">Or enter hex for custom accent (e.g. #ff00ff).</p>
                </div>
              </label>
              )}
              {hasPremiumAccess && (
              <>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Text color <span className="text-[var(--muted)]/70">(optional)</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    name="customTextColor"
                    defaultValue={(profile as { customTextColor?: string }).customTextColor ?? ""}
                    placeholder="#e2e8f0"
                    maxLength={7}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <input
                    type="color"
                    className="h-9 w-9 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0"
                    defaultValue={(profile as { customTextColor?: string }).customTextColor || "#e2e8f0"}
                    onInput={(e) => {
                      const text = (e.target as HTMLInputElement).form?.querySelector<HTMLInputElement>('input[name="customTextColor"]');
                      if (text) text.value = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Background color <span className="text-[var(--muted)]/70">(optional)</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    name="customBackgroundColor"
                    defaultValue={(profile as { customBackgroundColor?: string }).customBackgroundColor ?? ""}
                    placeholder="#08090a"
                    maxLength={7}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <input
                    type="color"
                    className="h-9 w-9 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0"
                    defaultValue={(profile as { customBackgroundColor?: string }).customBackgroundColor || "#08090a"}
                    onInput={(e) => {
                      const text = (e.target as HTMLInputElement).form?.querySelector<HTMLInputElement>('input[name="customBackgroundColor"]');
                      if (text) text.value = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">Overrides page background. Clear to use theme default.</p>
              </label>
              </>
              )}
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
                <div className="mt-1">
                  <SearchableSelect
                    name="avatarShape"
                    defaultValue={(profile as { avatarShape?: string }).avatarShape ?? "circle"}
                    options={[
                      { value: "circle", label: "Circle" },
                      { value: "rounded", label: "Rounded square" },
                      { value: "square", label: "Square" },
                      { value: "soft", label: "Soft (rounded-xl)" },
                      { value: "hexagon", label: "Hexagon" },
                    ]}
                    searchThreshold={10}
                  />
                </div>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Layout density
                <div className="mt-1">
                  <SearchableSelect
                    name="layoutDensity"
                    defaultValue={(profile as { layoutDensity?: string }).layoutDensity ?? "default"}
                    options={[
                      { value: "default", label: "Default" },
                      { value: "compact", label: "Compact" },
                      { value: "spacious", label: "Spacious" },
                    ]}
                    searchThreshold={10}
                  />
                </div>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Card style
                <div className="mt-1">
                  <SearchableSelect
                    name="cardStyle"
                    defaultValue={profile.cardStyle ?? "default"}
                    options={[
                      { value: "default", label: "Default (rounded)" },
                      { value: "sharp", label: "Sharp corners" },
                      { value: "glass", label: "Glass (blur)" },
                      { value: "neon", label: "Neon (accent glow)" },
                      { value: "minimal", label: "Minimal" },
                      { value: "elevated", label: "Elevated" },
                    ]}
                    searchThreshold={10}
                  />
                </div>
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
                Backdrop blur
                <div className="mt-1">
                  <SearchableSelect
                    name="cardBlur"
                    value={cardBlurValue}
                    onChange={setCardBlurValue}
                    options={[
                      { value: "none", label: "None" },
                      { value: "sm", label: "Subtle" },
                      { value: "md", label: "Medium" },
                      { value: "lg", label: "Strong" },
                    ]}
                    searchThreshold={10}
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">Blur behind the card. Default subtle.</p>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Font
                <div className="mt-1">
                  <SearchableSelect
                    name="customFont"
                    value={customFontValue}
                    onChange={(v) => { setCustomFontValue(v); if (v !== "custom") setCustomFontUrlValue(""); }}
                    options={[
                      { value: "", label: "Default (JetBrains Mono)" },
                      { value: "jetbrains-mono", label: "JetBrains Mono" },
                      { value: "fira-code", label: "Fira Code" },
                      { value: "space-mono", label: "Space Mono" },
                      { value: "custom", label: "Custom (upload)" },
                    ]}
                    searchThreshold={10}
                  />
                </div>
                {customFontValue === "custom" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="customFontUrl" value={customFontUrlValue} />
                    <input
                      ref={customFontFileRef}
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
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
                            const fullUrl = (data.url || "").startsWith("http") ? data.url : `${base}${data.url || ""}`;
                            const typeParam = data.contentType ? `?type=${encodeURIComponent(data.contentType)}` : "";
                            setCustomFontUrlValue(`${fullUrl}${typeParam}`);
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
                      {customFontUploading ? "Uploading…" : "Upload .ttf, .otf, .woff, .woff2"}
                    </button>
                    {customFontUploadError && <p className="text-xs text-[var(--warning)]">{customFontUploadError}</p>}
                  </div>
                )}
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Cursor <span className="text-[var(--muted)]/70">(when viewing your profile)</span>
                <div className="mt-1">
                  <SearchableSelect
                    name="cursorStyle"
                    value={cursorStyleValue}
                    onChange={(v) => { setCursorStyleValue(v); if (v !== "custom") setCursorImageUrlValue(""); }}
                    groups={[
                      { label: "General", options: [{ value: "default", label: "Default" }] },
                      {
                        label: "Basic",
                        options: [
                          { value: "crosshair", label: "Crosshair" },
                          { value: "pointer", label: "Pointer" },
                          { value: "text", label: "Text" },
                          { value: "grab", label: "Grab" },
                        ],
                      },
                      {
                        label: "Themed shapes",
                        options: [
                          { value: "minimal", label: "Minimal (dot)" },
                          { value: "beam", label: "Beam (terminal)" },
                          { value: "spot", label: "Spot (spotlight)" },
                          { value: "ring", label: "Ring" },
                          { value: "neon", label: "Neon dot" },
                          { value: "bolt", label: "Bolt (lightning)" },
                          { value: "cross", label: "Cross" },
                          { value: "hex", label: "Hexagon" },
                        ],
                      },
                      {
                        label: "Effects",
                        options: [
                          { value: "glow", label: "Glow follower" },
                          { value: "trail", label: "Trail" },
                        ],
                      },
                      { label: "Custom", options: [{ value: "custom", label: "Custom (upload)" }] },
                    ]}
                    placeholder="Default"
                    searchPlaceholder="Search cursor style…"
                  />
                </div>
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
                <div className="mt-1">
                  <SearchableSelect
                    name="animationPreset"
                    defaultValue={(profile as { animationPreset?: string }).animationPreset ?? "none"}
                    groups={[
                      { label: "General", options: [{ value: "none", label: "None" }] },
                      {
                        label: "Entrance",
                        options: [
                          { value: "fade-in", label: "Fade in" },
                          { value: "slide-up", label: "Slide up" },
                          { value: "scale-in", label: "Scale in" },
                          { value: "bounce-in", label: "Bounce in" },
                          { value: "flip-in", label: "Flip in" },
                          { value: "slide-in-left", label: "Slide in from left" },
                          { value: "zoom-bounce", label: "Zoom bounce" },
                          { value: "blur-in", label: "Blur in" },
                          { value: "neon-glow", label: "Neon glow" },
                          { value: "drift-in", label: "Drift in" },
                          { value: "stagger", label: "Stagger cascade" },
                        ],
                      },
                      {
                        label: "Ongoing / Hover",
                        options: [
                          { value: "float", label: "Gentle float" },
                          { value: "pulse-border", label: "Pulse border" },
                          { value: "glow", label: "Glow on hover" },
                          { value: "shimmer", label: "Shimmer on links" },
                        ],
                      },
                    ]}
                    placeholder="None"
                    searchPlaceholder="Search animation…"
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">Entrance animations play on load. Ongoing/hover effects add ambient motion.</p>
              </label>
              <label className="block text-xs font-medium text-[var(--muted)]">
                Field animations <span className="text-[var(--muted)]/70">(name, tagline, description)</span>
                {!hasPremiumAccess && (
                  <div className="mt-1 mb-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-2 flex items-center gap-2">
                    <Lock size={16} weight="regular" className="text-[var(--accent)] shrink-0" />
                    <p className="text-xs text-[var(--muted)]">Typewriter, sparkle, and tagline/description animations require <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">Premium</Link>.</p>
                  </div>
                )}
                <div className="mt-1 space-y-2">
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block mb-0.5">Name</span>
                    <SearchableSelect
                      name="nameAnimation"
                      defaultValue={(profile as { nameAnimation?: string }).nameAnimation ?? "none"}
                      options={[
                        { value: "none", label: "None" },
                        ...(hasPremiumAccess ? [{ value: "typewriter", label: "Typewriter" }, { value: "sparkle", label: "Sparkle" }, { value: "sparkle-stars", label: "Sparkle stars" }] : []),
                        { value: "fade-in", label: "Fade in" },
                        { value: "slide-up", label: "Slide up" },
                        { value: "slide-in-left", label: "Slide in left" },
                        { value: "blur-in", label: "Blur in" },
                      ]}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block mb-0.5">Tagline</span>
                    <SearchableSelect
                      name="taglineAnimation"
                      defaultValue={(() => {
                        const v = (profile as { taglineAnimation?: string }).taglineAnimation ?? "none";
                        return !hasPremiumAccess && v !== "none" ? "none" : v;
                      })()}
                      options={[
                        { value: "none", label: "None" },
                        ...(hasPremiumAccess ? [{ value: "typewriter", label: "Typewriter" }, { value: "fade-in", label: "Fade in" }, { value: "slide-up", label: "Slide up" }, { value: "slide-in-left", label: "Slide in left" }, { value: "blur-in", label: "Blur in" }] : []),
                      ]}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block mb-0.5">Description</span>
                    <SearchableSelect
                      name="descriptionAnimation"
                      defaultValue={(() => {
                        const v = (profile as { descriptionAnimation?: string }).descriptionAnimation ?? "none";
                        return !hasPremiumAccess && v !== "none" ? "none" : v;
                      })()}
                      options={[
                        { value: "none", label: "None" },
                        ...(hasPremiumAccess ? [{ value: "fade-in", label: "Fade in" }, { value: "slide-up", label: "Slide up" }, { value: "slide-in-left", label: "Slide in left" }, { value: "blur-in", label: "Blur in" }] : []),
                      ]}
                    />
                  </div>
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">Typewriter reveals text character by character. Other options are entrance animations.</p>
              </label>
              <div className="space-y-5">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
                  <div className="px-4 py-3 border-b border-[var(--border)]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-[var(--accent)]/10 p-1.5">
                        <ImageIcon size={18} weight="duotone" className="text-[var(--accent)]" aria-hidden />
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)]">Custom background</span>
                    </div>
                      <span className="text-[10px] text-[var(--muted)]">Grid, gradient, animated, or custom media</span>
                  </div>
                  <div className="p-4 space-y-4">
                    <input type="hidden" name="backgroundType" value={backgroundTypeValue} />
                    <input type="hidden" name="backgroundUrl" value={["image", "video"].includes(backgroundTypeValue) ? backgroundUrlValue : ""} />
                    <div className="flex flex-wrap gap-2">
                      {BG_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setBackgroundTypeValue(opt);
                            setBackgroundUploadError(null);
                            if (opt === "grid" || opt === "gradient" || opt === "solid" || opt === "dither") {
                              setBackgroundUrlValue("");
                            } else if ((opt === "image" && backgroundTypeValue === "video") || (opt === "video" && backgroundTypeValue === "image")) {
                              setBackgroundUrlValue("");
                            }
                          }}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            backgroundTypeValue === opt
                              ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40"
                              : "bg-[var(--bg)]/60 text-[var(--muted)] border border-transparent hover:border-[var(--border)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          {opt === "grid" && <GridFour size={16} weight="regular" />}
                          {opt === "gradient" && <Sparkle size={16} weight="regular" />}
                          {opt === "solid" && <Square size={16} weight="regular" />}
                          {opt === "dither" && <SquaresFour size={16} weight="regular" />}
                          {opt === "image" && <ImageIcon size={16} weight="regular" />}
                          {opt === "video" && <VideoCamera size={16} weight="regular" />}
                          {opt === "grid" ? "Grid" : opt === "gradient" ? "Gradient" : opt === "solid" ? "Solid" : opt === "dither" ? "Animated" : opt === "image" ? "Image" : "Video"}
                        </button>
                      ))}
                    </div>
                    <label className="block">
                      <span className="text-[10px] text-[var(--muted)] block mb-1">Background effect</span>
                      {!hasPremiumAccess && (
                        <div className="mb-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-2 flex items-center gap-2">
                          <Lock size={16} weight="regular" className="text-[var(--accent)] shrink-0" />
                          <p className="text-xs text-[var(--muted)]">Snow, rain, blur, and retro effects require <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">Premium</Link>.</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {(hasPremiumAccess ? BG_EFFECT_OPTIONS : ["none"]).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setBackgroundEffectValue(hasPremiumAccess ? opt : "none")}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                              (hasPremiumAccess ? backgroundEffectValue : "none") === opt
                                ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40"
                                : "bg-[var(--bg)]/60 text-[var(--muted)] border border-transparent hover:border-[var(--border)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            {opt === "none" && <X size={16} weight="regular" />}
                            {opt === "snow" && <Snowflake size={16} weight="regular" />}
                            {opt === "rain" && <CloudRain size={16} weight="regular" />}
                            {opt === "blur" && <CircleHalf size={16} weight="regular" />}
                            {opt === "retro-computer" && <Monitor size={16} weight="regular" />}
                            {opt === "none" ? "None" : opt === "snow" ? "Snow" : opt === "rain" ? "Rain" : opt === "blur" ? "Blur" : "Retro"}
                          </button>
                        ))}
                      </div>
                      <input type="hidden" name="backgroundEffect" value={(hasPremiumAccess ? backgroundEffectValue : "none") === "none" ? "" : backgroundEffectValue} />
                    </label>
                    {(backgroundTypeValue === "image" || backgroundTypeValue === "video") && (
                      <>
                        {backgroundUrlValue ? (
                          <div className="relative rounded-lg overflow-hidden border border-[var(--border)]/50 bg-[var(--bg)]/80 group">
                            {backgroundTypeValue === "image" ? (
                              <div className="aspect-video relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={backgroundUrlValue} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                                  <span className="text-xs font-medium text-white/90">{backgroundTypeValue === "image" ? "Image" : "Video"} loaded</span>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => backgroundFileInputRef.current?.click()}
                                      disabled={backgroundUploading}
                                      className="rounded-md bg-white/20 px-2 py-1 text-xs font-medium text-white hover:bg-white/30 disabled:opacity-50"
                                    >
                                      Replace
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setBackgroundTypeValue("none"); setBackgroundUrlValue(""); }}
                                      className="rounded-md bg-red-500/30 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-500/50"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-video relative flex items-center justify-center bg-[var(--bg)]">
                                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                <video src={backgroundUrlValue} muted playsInline className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent)]/20">
                                    <Play size={24} weight="fill" className="text-[var(--accent)] ml-0.5" />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => backgroundFileInputRef.current?.click()}
                                      disabled={backgroundUploading}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)]/80 px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent)] disabled:opacity-50"
                                    >
                                      <UploadSimple size={16} weight="bold" />
                                      Replace
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setBackgroundTypeValue("none"); setBackgroundUrlValue(""); }}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                                    >
                                      <X size={16} weight="bold" />
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") backgroundFileInputRef.current?.click(); }}
                            onClick={() => backgroundFileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setBackgroundDragOver(true); }}
                            onDragLeave={() => setBackgroundDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setBackgroundDragOver(false);
                              const file = e.dataTransfer?.files?.[0];
                              if (file) handleBackgroundFileUpload(file);
                            }}
                            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-10 px-6 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] ${
                              backgroundDragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--bg)]/40 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
                            }`}
                          >
                            <div className="rounded-full bg-[var(--accent)]/10 p-4">
                              <UploadSimple size={32} weight="duotone" className="text-[var(--accent)]" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-[var(--foreground)]">Drop {backgroundTypeValue === "image" ? "an image" : "a video"} here or click to upload</p>
                              <p className="text-[10px] text-[var(--muted)] mt-0.5">PNG, JPG, GIF, WebP · MP4, WebM, MOV · max 100 MB</p>
                            </div>
                            <span className="text-xs text-[var(--accent)] font-medium">Click to browse</span>
                          </div>
                        )}
                        <input
                          ref={backgroundFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/x-m4v,video/webm,video/quicktime,video/x-matroska"
                          className="sr-only"
                          aria-hidden
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBackgroundFileUpload(file);
                            e.target.value = "";
                          }}
                        />
                        {backgroundUploading && (
                          <p className="text-xs text-[var(--accent)] animate-pulse">Uploading…</p>
                        )}
                      </>
                    )}
                    {backgroundUploadError && (
                      <p className="text-xs text-[var(--warning)] rounded-lg bg-[var(--warning)]/10 px-3 py-2">{backgroundUploadError}</p>
                    )}
                    {(backgroundTypeValue === "video" || backgroundAudioUrlValue) && (
                      <label className="block text-xs font-medium text-[var(--muted)]">
                        Overlay text <span className="text-[var(--muted)]/70">(shown before visitors unlock profile)</span>
                        <input
                          type="text"
                          name="unlockOverlayText"
                          defaultValue={(profile as { unlockOverlayText?: string }).unlockOverlayText ?? ""}
                          placeholder="Click here to view profile"
                          maxLength={80}
                          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
                  <div className="px-4 py-3 border-b border-[var(--border)]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-[var(--accent)]/10 p-1.5">
                        <MusicNotes size={18} weight="duotone" className="text-[var(--accent)]" aria-hidden />
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)]">Background audio</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)]">Ambient loop · separate from visual</span>
                  </div>
                  <div className="p-4 space-y-4">
                    <input type="hidden" name="backgroundAudioUrl" value={backgroundAudioUrlValue} />
                    {backgroundAudioUrlValue ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--accent)]/15 shrink-0">
                            <MusicNotes size={24} weight="fill" className="text-[var(--accent)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)]">Audio track loaded</p>
                            <p className="text-[10px] text-[var(--muted)]">Plays when visitor unlocks profile</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <audio src={backgroundAudioUrlValue} controls className="h-8 flex-1 min-w-0 max-w-full sm:max-w-[160px] opacity-90" preload="metadata" />
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => backgroundAudioFileRef.current?.click()}
                              disabled={backgroundAudioUploading}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
                            >
                              <UploadSimple size={14} weight="bold" />
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => setBackgroundAudioUrlValue("")}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--warning)]/50 hover:text-[var(--warning)] transition-colors"
                            >
                              <X size={14} weight="bold" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") backgroundAudioFileRef.current?.click(); }}
                        onClick={() => backgroundAudioFileRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setAudioDragOver(true); }}
                        onDragLeave={() => setAudioDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setAudioDragOver(false);
                          const file = e.dataTransfer?.files?.[0];
                          if (file && (file.type.startsWith("audio/") || /\.(mp3|aac|m4a)$/i.test(file.name))) handleBackgroundAudioUpload(file);
                        }}
                        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-8 px-6 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] ${
                          audioDragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--bg)]/40 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
                        }`}
                      >
                        <div className="rounded-full bg-[var(--accent)]/10 p-3">
                          <MusicNotes size={28} weight="duotone" className="text-[var(--accent)]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-[var(--foreground)]">Drop an audio file or click to upload</p>
                          <p className="text-[10px] text-[var(--muted)] mt-0.5">MP3 or AAC · max 10 MB</p>
                        </div>
                        <span className="text-xs text-[var(--accent)] font-medium">Click to browse</span>
                      </div>
                    )}
                    <input
                      ref={backgroundAudioFileRef}
                      type="file"
                      accept=".mp3,.aac,audio/mpeg,audio/mp3,audio/aac"
                      className="sr-only"
                      aria-hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBackgroundAudioUpload(file);
                        e.target.value = "";
                      }}
                    />
                    {backgroundAudioUploading && (
                      <p className="text-xs text-[var(--accent)] animate-pulse">Uploading…</p>
                    )}
                    {backgroundAudioUploadError && (
                      <p className="text-xs text-[var(--warning)] rounded-lg bg-[var(--warning)]/10 px-3 py-2">{backgroundAudioUploadError}</p>
                    )}
                    <p className="text-[10px] text-[var(--muted)]">Works with image, video, or no visual background.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={activeEditorSection === "widgets" ? "block space-y-4" : "hidden"}>
              {/* Widgets — Discord, Dread.lol, Roblox (max 4 total) */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-[var(--accent)]/10 p-1.5">
                      <SquaresFour size={18} weight="regular" className="text-[var(--accent)]" aria-hidden />
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]">Widgets</span>
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {widgetCount} of {MAX_WIDGETS} selected
                  </span>
                </div>
                <div className="p-4 space-y-5">
                  <p className="text-xs text-[var(--muted)]">
                    Info cards appear on your profile. Choose up to {MAX_WIDGETS} total across all sources.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="widgetsMatchAccent"
                      checked={widgetsMatchAccent}
                      onChange={(e) => setWidgetsMatchAccent(e.target.checked)}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm font-medium text-[var(--foreground)]">Match accent color</span>
                  </label>
                  <p className="text-[11px] text-[var(--muted)] -mt-3">
                    When on, widgets use your profile accent color instead of brand colors.
                  </p>
                  {(() => {
                    const WidgetCheckbox = ({
                      id,
                      checked,
                      setChecked,
                      name,
                      icon,
                      label,
                      desc,
                      accent,
                    }: {
                      id: string;
                      checked: boolean;
                      setChecked: (v: boolean) => void;
                      name: string;
                      icon: React.ReactNode;
                      label: string;
                      desc: string;
                      accent: "discord" | "site" | "roblox";
                    }) => (
                      <label
                        key={id}
                        className={`flex items-start gap-3 rounded-lg border px-3 py-3 cursor-pointer transition-colors ${
                          checked
                            ? accent === "discord"
                              ? "border-[#5865F2]/40 bg-[#5865F2]/10"
                              : accent === "roblox"
                                ? "border-[#00A2FF]/40 bg-[#00A2FF]/10"
                                : "border-[var(--accent)]/40 bg-[var(--accent)]/10"
                            : canEnableMore
                              ? "border-[var(--border)]/60 hover:border-[var(--border)]"
                              : "border-[var(--border)]/50 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={name}
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked && !canEnableMore) return;
                            setChecked(e.target.checked);
                          }}
                          disabled={!checked && !canEnableMore}
                          className="mt-1 rounded border-[var(--border)]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {icon}
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[var(--muted)]">{desc}</p>
                        </div>
                      </label>
                    );
                    return (
                      <>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5865F2] mb-2">Discord</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <WidgetCheckbox
                              id="accountAge"
                              checked={widgetAccountAge}
                              setChecked={setWidgetAccountAge}
                              name="showDiscordWidgetAccountAge"
                              icon={<DiscordLogo size={18} weight="fill" className="shrink-0 text-[#5865F2]" aria-hidden />}
                              label="Account age"
                              desc="How long you've had your Discord account"
                              accent="discord"
                            />
                            <WidgetCheckbox
                              id="serverCount"
                              checked={widgetServerCount}
                              setChecked={setWidgetServerCount}
                              name="showDiscordWidgetServerCount"
                              icon={<Buildings size={18} weight="regular" className="shrink-0 text-[#5865F2]" aria-hidden />}
                              label="Server count"
                              desc="Number of Discord servers you're in"
                              accent="discord"
                            />
                            <WidgetCheckbox
                              id="serverInvite"
                              checked={widgetServerInvite}
                              setChecked={setWidgetServerInvite}
                              name="showDiscordWidgetServerInvite"
                              icon={<ArrowSquareOut size={18} weight="regular" className="shrink-0 text-[#5865F2]" aria-hidden />}
                              label="Server invite"
                              desc="Link for visitors to join your Discord"
                              accent="discord"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">Dread.lol</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <WidgetCheckbox
                              id="joined"
                              checked={widgetJoined}
                              setChecked={setWidgetJoined}
                              name="showDiscordWidgetJoined"
                              icon={<CalendarBlank size={18} weight="regular" className="shrink-0 text-[var(--accent)]" aria-hidden />}
                              label="Joined"
                              desc="When you signed up for Dread.lol"
                              accent="site"
                            />
                          </div>
                        </div>
                        {robloxLinked ? (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#00A2FF] mb-2">Roblox</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <WidgetCheckbox
                                id="robloxAccountAge"
                                checked={widgetRobloxAccountAge}
                                setChecked={setWidgetRobloxAccountAge}
                                name="showRobloxWidgetAccountAge"
                                icon={
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#00A2FF]" aria-hidden>
                                    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.09 8 12 11.82 4.91 8 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
                                  </svg>
                                }
                                label="Account age"
                                desc="How long you've had your Roblox account"
                                accent="roblox"
                              />
                              <WidgetCheckbox
                                id="robloxProfile"
                                checked={widgetRobloxProfile}
                                setChecked={setWidgetRobloxProfile}
                                name="showRobloxWidgetProfile"
                                icon={
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#00A2FF]" aria-hidden>
                                    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.09 8 12 11.82 4.91 8 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
                                  </svg>
                                }
                                label="Profile link"
                                desc="Link to your Roblox profile"
                                accent="roblox"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#00A2FF] mb-2">Roblox</p>
                            <Link
                              href="/api/auth/roblox"
                              className="inline-flex items-center gap-2.5 rounded-lg border border-[#00A2FF]/40 bg-[#00A2FF]/15 px-4 py-2.5 text-sm font-medium text-[#00A2FF] transition-colors hover:border-[#00A2FF]/60 hover:bg-[#00A2FF]/20"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.09 8 12 11.82 4.91 8 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
                              </svg>
                              Link Roblox for 2 more widget options
                            </Link>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {widgetServerInvite && (
                    <label className="block pt-1">
                      <span className="text-xs font-medium text-[var(--muted)]">Discord invite link</span>
                      <input
                        type="text"
                        name="discordInviteUrl"
                        value={discordInviteInput}
                        onChange={(e) => setDiscordInviteInput(e.target.value)}
                        placeholder="https://discord.gg/abc123 or abc123"
                        className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                      {discordInviteInput.trim() && !/^(https?:\/\/)?(discord\.gg\/|discord\.com\/invite\/)[a-zA-Z0-9-]+$|^[a-zA-Z0-9-]{2,32}$/.test(
                        discordInviteInput.trim()
                      ) && (
                        <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-500">
                          Use a valid Discord invite (e.g. discord.gg/abc123)
                        </p>
                      )}
                    </label>
                  )}
                  {robloxLinked && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border)]/50">
                      <span className="text-xs text-[var(--terminal)]">✓ Roblox linked</span>
                      <Link href="/api/auth/roblox" className="text-xs text-[#00A2FF] hover:underline">
                        Re-link
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm("Unlink Roblox? You can re-link anytime.")) {
                            const res = await fetch(`/api/profiles/${profile.slug}/roblox/disconnect`, { method: "DELETE" });
                            if (res.ok) window.location.reload();
                          }
                        }}
                        className="text-xs text-[var(--muted)] hover:text-[var(--warning)]"
                      >
                        Unlink
                      </button>
                    </div>
                  )}
                  {(widgetPreviewFiltered || ((widgetRobloxAccountAge || widgetRobloxProfile) && baseProfileForPreview?.robloxWidgets)) && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] mb-2">Preview</p>
                      <div className="rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/60 p-3 space-y-3">
                        {widgetPreviewFiltered && <DiscordWidgetsDisplay data={widgetPreviewFiltered} matchAccent={widgetsMatchAccent} />}
                        {(widgetRobloxAccountAge || widgetRobloxProfile) && baseProfileForPreview?.robloxWidgets && (
                          <RobloxWidgetsDisplay
                            data={{
                              ...(widgetRobloxAccountAge && baseProfileForPreview.robloxWidgets.accountAge
                                ? { accountAge: baseProfileForPreview.robloxWidgets.accountAge }
                                : {}),
                              ...(widgetRobloxProfile && baseProfileForPreview.robloxWidgets.profile
                                ? { profile: baseProfileForPreview.robloxWidgets.profile }
                                : {}),
                            }}
                            matchAccent={widgetsMatchAccent}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={activeEditorSection === "audio" ? "block space-y-4" : "hidden"}>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
                <div className="px-4 py-3 border-b border-[var(--border)]/50 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-[var(--accent)]/10 p-1.5">
                      <MusicNotes size={18} weight="duotone" className="text-[var(--accent)]" aria-hidden />
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]">Audio Player</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-3 cursor-pointer group">
                      <span className="text-xs text-[var(--muted)]">Show player on profile</span>
                      <span className={`relative w-10 h-6 rounded-full transition-colors ${showAudioPlayerValue ? "bg-[var(--accent)]/30" : "bg-[var(--border)]"}`}>
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[var(--foreground)] transition-transform ${showAudioPlayerValue ? "translate-x-5" : "translate-x-0"}`} />
                      </span>
                      <input
                        type="checkbox"
                        name="showAudioPlayer"
                        checked={showAudioPlayerValue}
                        onChange={(e) => setShowAudioPlayerValue(e.target.checked)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[var(--muted)] mb-4">
                    Visitors can play your tracks directly on your profile. Add tracks below and enable the player.
                  </p>
                  {showAudioPlayerValue && (
                    <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4">
                      <p className="text-xs font-medium text-[var(--foreground)] mb-3">Visualizer</p>
                      <div className="flex flex-wrap gap-2">
                        {(["", "bars", "wave", "spectrum"] as const).map((opt) => {
                          const v = audioVisualizerStyleValue;
                          const match = opt ? v === opt : !v || !["bars", "wave", "spectrum"].includes(v ?? "");
                          return (
                            <button
                              key={opt || "none"}
                              type="button"
                              onClick={() => setAudioVisualizerStyleValue(opt)}
                              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                match
                                  ? "bg-[var(--accent)]/25 text-[var(--accent)] border border-[var(--accent)]/50"
                                  : "bg-[var(--bg)]/80 text-[var(--muted)] border border-[var(--border)]/50 hover:border-[var(--border)] hover:text-[var(--foreground)]"
                              }`}
                            >
                              {opt || "None"}
                            </button>
                          );
                        })}
                      </div>
                      <input type="hidden" name="audioVisualizerStyle" value={(() => {
                        const v = audioVisualizerStyleValue;
                        return ["bars", "wave", "spectrum"].includes(v ?? "") ? v : "";
                      })()} />
                    </div>
                  )}
                  {showAudioPlayerValue && (
                    <>
                      <input type="hidden" name="audioTracks" value={JSON.stringify(audioTracksValue)} />
                      {audioTracksValue.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {audioTracksValue.map((track, i) => (
                            <div
                              key={`${track.url}-${i}`}
                              draggable
                              onDragStart={() => setDraggedTrackIndex(i)}
                              onDragEnd={() => setDraggedTrackIndex(null)}
                              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const from = draggedTrackIndex;
                                if (from != null && from !== i) moveTrack(from, i);
                                setDraggedTrackIndex(null);
                              }}
                              className={`flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 px-3 py-2.5 transition-all group ${draggedTrackIndex === i ? "opacity-50 border-dashed" : "hover:border-[var(--border-bright)]"}`}
                            >
                              <DotsSixVertical size={18} weight="regular" className="text-[var(--muted)] cursor-grab active:cursor-grabbing shrink-0" />
                              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--accent)]/10 shrink-0">
                                <MusicNotes size={18} weight="fill" className="text-[var(--accent)]" />
                              </div>
                              {editingTrackIndex === i ? (
                                <input
                                  type="text"
                                  value={editingTrackTitle}
                                  onChange={(e) => setEditingTrackTitle(e.target.value)}
                                  onBlur={() => {
                                    setAudioTracksValue((prev) => {
                                      const next = [...prev];
                                      next[i] = { ...next[i], title: editingTrackTitle.trim() || undefined };
                                      return next;
                                    });
                                    setEditingTrackIndex(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                  }}
                                  autoFocus
                                  className="flex-1 min-w-0 rounded border border-[var(--accent)]/50 bg-[var(--bg)] px-2 py-1 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTrackIndex(i);
                                    setEditingTrackTitle(track.title || `Track ${i + 1}`);
                                  }}
                                  className="flex-1 min-w-0 text-left text-sm font-medium text-[var(--foreground)] truncate hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                                >
                                  {track.title || `Track ${i + 1}`}
                                  <PencilSimple size={12} weight="regular" className="shrink-0 opacity-50 group-hover:opacity-100" />
                                </button>
                              )}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setAudioTracksValue((prev) => prev.filter((_, j) => j !== i))}
                                  className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--warning)]/20 hover:text-[var(--warning)] transition-colors"
                                  aria-label="Remove track"
                                >
                                  <Trash size={14} weight="regular" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") audioTrackFileRef.current?.click(); }}
                        onClick={() => audioTrackFileRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setAudioTracksDragOver(true); }}
                        onDragLeave={() => setAudioTracksDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setAudioTracksDragOver(false);
                          const file = e.dataTransfer?.files?.[0];
                          if (file && (file.type.startsWith("audio/") || /\.(mp3|aac|m4a)$/i.test(file.name))) handleAudioTrackUpload(file);
                        }}
                        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 px-4 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] ${
                          audioTracksDragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--bg)]/40 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
                        }`}
                      >
                        <div className="rounded-full bg-[var(--accent)]/10 p-2.5">
                          <UploadSimple size={22} weight="duotone" className="text-[var(--accent)]" />
                        </div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {audioTracksValue.length > 0 ? "Add another track" : "Add tracks — drop or click"}
                        </p>
                        <p className="text-[10px] text-[var(--muted)]">MP3 or AAC · max 10 MB per track</p>
                      </div>
                      <input
                        ref={audioTrackFileRef}
                        type="file"
                        accept=".mp3,.aac,audio/mpeg,audio/mp3,audio/aac"
                        className="sr-only"
                        aria-hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAudioTrackUpload(file);
                          e.target.value = "";
                        }}
                      />
                      {audioTrackUploading && (
                        <p className="mt-2 text-xs text-[var(--accent)] animate-pulse">Uploading…</p>
                      )}
                      {audioTrackUploadError && (
                        <p className="mt-2 text-xs text-[var(--warning)] rounded-lg bg-[var(--warning)]/10 px-3 py-2">{audioTrackUploadError}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className={activeEditorSection === "versions" ? "block space-y-4" : "hidden"}>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
                <div className="px-4 py-3 border-b border-[var(--border)]/50 flex items-center gap-2">
                  <div className="rounded-lg bg-[var(--accent)]/10 p-1.5">
                    <ClockCounterClockwise size={18} weight="duotone" className="text-[var(--accent)]" aria-hidden />
                  </div>
                  <span className="text-sm font-medium text-[var(--foreground)]">Save & restore</span>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-xs text-[var(--muted)]">
                    Save up to 5 snapshots of your profile (including gallery and short links). Each version keeps its own copy of uploaded files.
                  </p>
                  <ProfileVersionsPanel
                    profileId={profile.id}
                    versions={initialVersions}
                    onSaved={() => router.refresh()}
                    onRestored={() => router.refresh()}
                    onDeleted={() => router.refresh()}
                  />
                </div>
              </div>
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
            <SubmitButton onRevert={handleRevert} />
          </form>
          )}
          </div>
        </div>
      </section>

      {/* Preview panel - right side on xl, full width when tab=preview on <xl */}
      <section
        className={`animate-dashboard-panel flex flex-col flex-1 min-h-0 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm ${
          tab === "editor" ? "hidden xl:flex" : ""
        }`}
        aria-label="Profile preview"
      >
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between gap-2 bg-[var(--bg)]/80 shrink-0">
          <div className="flex items-center gap-2">
            <Eye size={18} weight="regular" className="text-[var(--terminal)]" aria-hidden />
            <span className="text-sm font-medium text-[var(--foreground)]">Live preview</span>
            <span className="text-xs text-[var(--muted)] hidden sm:inline">— updates as you type</span>
          </div>
          <Link
            href={`/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Open in tab
          </Link>
        </div>
        <div className="flex-1 min-h-0 relative bg-[var(--bg)]">
          <iframe
            ref={previewIframeRef}
            src="/live-preview"
            title="Live profile preview"
            className="absolute inset-0 w-full h-full rounded-b-xl border-0"
          />
        </div>
      </section>
      </div>

    </div>
  );
}
