"use client";

import { useActionState, useState, useCallback, useEffect, useRef, useMemo, useDeferredValue } from "react";
import { extractFileIdFromFilesUrl } from "@/lib/file-id";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProfileRow } from "@/lib/db/schema";
import { updateProfileAction, type ProfileFormState } from "@/app/[locale]/dashboard/actions";
import { normalizeSlug } from "@/lib/slug";
import type { ProfileVersionRow } from "@/lib/profile-versions";
import type { CryptoWidgetData, CryptoWalletProfileInput } from "@/lib/crypto-widgets";
import { getWalletInputsFromProfileRow } from "@/lib/crypto-widgets";
import type { GithubWidgetData } from "@/lib/github-widgets";
import { normalizeGithubUsername, parseEnabledGithubWidgets } from "@/lib/github-widgets";
import DashboardLinks from "@/app/[locale]/dashboard/DashboardLinks";
import { normalizeWidgetData } from "@/app/components/DiscordWidgetsDisplay";
import type { DiscordWidgetData } from "@/lib/discord-widgets";
import { resolveCardEffects, type Profile } from "@/lib/profiles";
import { ProfileEditorLayout } from "@/app/[locale]/dashboard/profile-editor/ProfileEditorLayout";
import { SubmitButton } from "@/app/[locale]/dashboard/profile-editor/SubmitButton";
import { useProfileEditorPreviewSync } from "@/app/[locale]/dashboard/profile-editor/useProfileEditorPreviewSync";
import { useEditorSectionUrlSync } from "@/app/[locale]/dashboard/profile-editor/useEditorSectionUrlSync";
import { parseTerminalCommandsForEditor } from "@/app/[locale]/dashboard/profile-editor/utils";
import {
  BACKGROUND_IMAGE_TYPES,
  BACKGROUND_VIDEO_TYPES,
  MAX_WIDGETS,
} from "@/app/[locale]/dashboard/profile-editor/constants";

const BG_EFFECT_OPTIONS = ["none", "snow", "rain", "blur", "retro-computer"] as const;
import type { EditorSectionId } from "@/app/[locale]/dashboard/profile-editor/types";
import { ProfileEditorFormFields } from "@/app/[locale]/dashboard/profile-editor/ProfileEditorFormFields";
import { ProfileEditorOnboarding } from "@/app/[locale]/dashboard/profile-editor/ProfileEditorOnboarding";
import { SectionTip } from "@/app/[locale]/dashboard/profile-editor/SectionTip";
import { editorSectionAriaLabel, useEditorSectionFocus } from "@/app/[locale]/dashboard/profile-editor/useEditorSectionFocus";
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
  /** Pre-fetched crypto wallet balances for dashboard preview. */
  cryptoWidgetPreviewData?: CryptoWidgetData[] | null;
  /** Pre-fetched GitHub stats for dashboard preview. */
  githubWidgetPreviewData?: GithubWidgetData | null;
  /** Whether the user has linked their Roblox account via OAuth. */
  robloxLinked?: boolean;
  /** Whether the user has Premium (for gating effects, colors, analytics). */
  hasPremiumAccess?: boolean;
}

type DashboardTab = "editor" | "preview";

export default function DashboardMyProfile({
  profile,
  baseProfileForPreview,
  versions: initialVersions = [],
  discordAvatarUrl,
  availableDiscordBadges = [],
  widgetPreviewData = null,
  cryptoWidgetPreviewData = null,
  githubWidgetPreviewData = null,
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
  const deferredTagline = useDeferredValue(taglineValue);
  const deferredDescription = useDeferredValue(descriptionValue);
  const [bannerValue, setBannerValue] = useState(profile.banner ?? "");
  const [avatarUrlValue, setAvatarUrlValue] = useState(profile.avatarUrl ?? "");
  const [slugCheck, setSlugCheck] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [activeEditorSection, setActiveEditorSection] = useState<EditorSectionId>("basics");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
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
  const [backgroundAudioStartSecondsValue, setBackgroundAudioStartSecondsValue] = useState<string>(() => {
    const v = (profile as { backgroundAudioStartSeconds?: number }).backgroundAudioStartSeconds;
    return typeof v === "number" && v >= 0 ? String(v) : "";
  });
  const backgroundAudioFileRef = useRef<HTMLInputElement>(null);
  const [backgroundDragOver, setBackgroundDragOver] = useState(false);
  const [audioDragOver, setAudioDragOver] = useState(false);
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
  const [cryptoWalletEthereum, setCryptoWalletEthereum] = useState(
    () => getWalletInputsFromProfileRow(profile as CryptoWalletProfileInput).ethereum
  );
  const [cryptoWalletBitcoin, setCryptoWalletBitcoin] = useState(
    () => getWalletInputsFromProfileRow(profile as CryptoWalletProfileInput).bitcoin
  );
  const [cryptoWalletSolana, setCryptoWalletSolana] = useState(
    () => getWalletInputsFromProfileRow(profile as CryptoWalletProfileInput).solana
  );
  const [cryptoPreviewData, setCryptoPreviewData] = useState<CryptoWidgetData[] | null>(() => cryptoWidgetPreviewData ?? null);
  const [githubUsernameInput, setGithubUsernameInput] = useState(
    () => (profile as { githubUsername?: string | null }).githubUsername ?? ""
  );
  const [widgetGithubLastPush, setWidgetGithubLastPush] = useState(
    () => (profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("lastPush") ?? false
  );
  const [widgetGithubPublicRepos, setWidgetGithubPublicRepos] = useState(
    () => (profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("publicRepos") ?? false
  );
  const [widgetGithubContributions, setWidgetGithubContributions] = useState(
    () => (profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("contributions") ?? false
  );
  const [widgetGithubProfile, setWidgetGithubProfile] = useState(
    () => (profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("profile") ?? false
  );
  const [githubPreviewData, setGithubPreviewData] = useState<GithubWidgetData | null>(() => githubWidgetPreviewData ?? null);
  const [widgetsMatchAccent, setWidgetsMatchAccent] = useState(() =>
    (profile as { widgetsMatchAccent?: boolean }).widgetsMatchAccent ?? false
  );
  const [copyableSocials, setCopyableSocials] = useState(
    () => (profile as { copyableSocials?: boolean }).copyableSocials ?? false
  );
  const [discordInviteInput, setDiscordInviteInput] = useState(
    (profile as { discordInviteUrl?: string }).discordInviteUrl ?? ""
  );
  const widgetCount =
    [
      widgetAccountAge,
      widgetJoined,
      widgetServerCount,
      widgetServerInvite,
      widgetRobloxAccountAge,
      widgetRobloxProfile,
      widgetGithubLastPush,
      widgetGithubPublicRepos,
      widgetGithubContributions,
      widgetGithubProfile,
    ].filter(Boolean).length;
  const canEnableMore = widgetCount < MAX_WIDGETS;

  const widgetPreviewFiltered = useMemo(() => {
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
  }, [
    widgetPreviewData,
    discordInviteInput,
    widgetAccountAge,
    widgetJoined,
    widgetServerCount,
    widgetServerInvite,
  ]);

  const githubPreviewFiltered = useMemo(() => {
    if (!githubPreviewData) return null;
    const out: GithubWidgetData = { ...githubPreviewData };
    if (!widgetGithubLastPush) delete out.lastPush;
    if (!widgetGithubPublicRepos) delete out.publicRepos;
    if (!widgetGithubContributions) {
      delete out.contributions;
      delete out.contributionsUnavailable;
    }
    if (
      !out.lastPush &&
      out.publicRepos == null &&
      !out.contributions &&
      !out.contributionsUnavailable &&
      !(widgetGithubProfile && githubPreviewData?.profileUrl)
    ) {
      return null;
    }
    return out;
  }, [githubPreviewData, widgetGithubLastPush, widgetGithubPublicRepos, widgetGithubContributions, widgetGithubProfile]);

  const selectedGithubWidgetsCsv = useMemo(
    () =>
      [
        widgetGithubLastPush && "lastPush",
        widgetGithubPublicRepos && "publicRepos",
        widgetGithubContributions && "contributions",
        widgetGithubProfile && "profile",
      ]
        .filter(Boolean)
        .join(","),
    [widgetGithubLastPush, widgetGithubPublicRepos, widgetGithubContributions, widgetGithubProfile]
  );

  useEffect(() => {
    const w = getWalletInputsFromProfileRow(profile as CryptoWalletProfileInput);
    setCryptoWalletEthereum(w.ethereum);
    setCryptoWalletBitcoin(w.bitcoin);
    setCryptoWalletSolana(w.solana);
  }, [profile]);

  useEffect(() => {
    setGithubUsernameInput((profile as { githubUsername?: string | null }).githubUsername ?? "");
    setWidgetGithubLastPush((profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("lastPush") ?? false);
    setWidgetGithubPublicRepos((profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("publicRepos") ?? false);
    setWidgetGithubContributions((profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("contributions") ?? false);
    setWidgetGithubProfile((profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("profile") ?? false);
  }, [profile]);

  useEffect(() => {
    const eth = cryptoWalletEthereum.trim();
    const btc = cryptoWalletBitcoin.trim();
    const sol = cryptoWalletSolana.trim();
    if (!eth && !btc && !sol) {
      setCryptoPreviewData(null);
      return;
    }
    const saved = getWalletInputsFromProfileRow(profile as CryptoWalletProfileInput);
    if (
      eth === saved.ethereum &&
      btc === saved.bitcoin &&
      sol === saved.solana &&
      cryptoWidgetPreviewData &&
      cryptoWidgetPreviewData.length > 0
    ) {
      setCryptoPreviewData(cryptoWidgetPreviewData);
      return;
    }
    let cancelled = false;
    const q = new URLSearchParams();
    if (eth) q.set("ethereum", eth);
    if (btc) q.set("bitcoin", btc);
    if (sol) q.set("solana", sol);
    fetch(`/api/crypto-widget-preview?${q.toString()}`)
      .then((r) => r.json())
      .then((j: CryptoWidgetData[] | null) => {
        if (cancelled) return;
        if (j && Array.isArray(j) && j.length > 0) setCryptoPreviewData(j);
        else setCryptoPreviewData(null);
      })
      .catch(() => {
        if (!cancelled) setCryptoPreviewData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, cryptoWalletEthereum, cryptoWalletBitcoin, cryptoWalletSolana, cryptoWidgetPreviewData]);

  useEffect(() => {
    const login = normalizeGithubUsername(githubUsernameInput);
    if (!login || !selectedGithubWidgetsCsv) {
      setGithubPreviewData(null);
      return;
    }
    const savedLogin = normalizeGithubUsername((profile as { githubUsername?: string | null }).githubUsername ?? "");
    const savedCsv = parseEnabledGithubWidgets((profile as { showGithubWidgets?: string }).showGithubWidgets).join(",");
    if (
      login === savedLogin &&
      selectedGithubWidgetsCsv === savedCsv &&
      githubWidgetPreviewData?.login &&
      (githubWidgetPreviewData.lastPush ||
        githubWidgetPreviewData.publicRepos != null ||
        githubWidgetPreviewData.contributions ||
        githubWidgetPreviewData.contributionsUnavailable ||
        (widgetGithubProfile && githubWidgetPreviewData.profileUrl))
    ) {
      setGithubPreviewData(githubWidgetPreviewData);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/github-widget-preview?login=${encodeURIComponent(login)}&widgets=${encodeURIComponent(selectedGithubWidgetsCsv)}`
    )
      .then((r) => r.json())
      .then((j: GithubWidgetData | null) => {
        if (cancelled) return;
        if (j?.login) setGithubPreviewData(j);
        else setGithubPreviewData(null);
      })
      .catch(() => {
        if (!cancelled) setGithubPreviewData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, githubUsernameInput, selectedGithubWidgetsCsv, githubWidgetPreviewData, widgetGithubProfile]);

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
        const id = extractFileIdFromFilesUrl(prevUrl);
        if (id) form.append("replaceFid", id);
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
        const id = extractFileIdFromFilesUrl(prevUrl);
        if (id) form.append("replaceFid", id);
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
  const cardEffectsInitial = resolveCardEffects(profile);
  const [cardEffectTilt, setCardEffectTilt] = useState(cardEffectsInitial.cardEffectTilt);
  const [cardEffectSpotlight, setCardEffectSpotlight] = useState(cardEffectsInitial.cardEffectSpotlight);
  const [cardEffectGlare, setCardEffectGlare] = useState(cardEffectsInitial.cardEffectGlare);
  const [cardEffectMagneticBorder, setCardEffectMagneticBorder] = useState(cardEffectsInitial.cardEffectMagneticBorder);
  const slugCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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

  // Ctrl+Enter / Cmd+Enter — main profile form or links form
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (tab !== "editor") return;
        const id = activeEditorSection === "links" ? "profile-links-form" : "profile-editor-form";
        const form = document.getElementById(id) as HTMLFormElement | null;
        form?.requestSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tab, activeEditorSection]);

  const profileUpdatedAtMs = (profile as { updatedAt?: Date }).updatedAt?.getTime?.() ?? 0;
  const formKey = `${profile.id}-${profileUpdatedAtMs}`;
  const serverCopyableSocials = (profile as { copyableSocials?: boolean }).copyableSocials ?? false;

  useEffect(() => {
    setCopyableSocials(serverCopyableSocials);
  }, [profile.id, profileUpdatedAtMs, serverCopyableSocials]);

  /** Live preview payload; `activeEditorSection` is intentionally omitted so section nav does not re-sync the iframe. */
  const previewProfile = useMemo(() => (baseProfileForPreview
    ? ({
        ...baseProfileForPreview,
        slug: slugValue || baseProfileForPreview.slug,
        tagline: deferredTagline || undefined,
        description: deferredDescription,
        banner: bannerValue || undefined,
        avatar: avatarUrlValue === "discord" ? (discordAvatarUrl || baseProfileForPreview.avatar) : (avatarUrlValue || baseProfileForPreview.avatar),
        terminalCommands: terminalCommandEntries.filter((e) => e.command.trim() || e.output.trim()),
        backgroundType: ["grid", "gradient", "solid", "dither", "image", "video"].includes(backgroundTypeValue)
          ? backgroundTypeValue
          : baseProfileForPreview.backgroundType,
        backgroundUrl: ["image", "video"].includes(backgroundTypeValue) ? backgroundUrlValue || undefined : undefined,
        backgroundAudioUrl: backgroundAudioUrlValue?.trim() || undefined,
        backgroundAudioStartSeconds: (() => {
          const v = parseFloat(backgroundAudioStartSecondsValue);
          return !Number.isNaN(v) && v > 0 ? v : undefined;
        })(),
        backgroundEffect: backgroundEffectValue && backgroundEffectValue !== "none" ? backgroundEffectValue : undefined,
        cardOpacity: cardOpacityValue,
        cardBlur: ["none", "sm", "md", "lg"].includes(cardBlurValue) ? (cardBlurValue as "none" | "sm" | "md" | "lg") : baseProfileForPreview.cardBlur,
        cardEffectTilt,
        cardEffectSpotlight,
        cardEffectGlare,
        cardEffectMagneticBorder,
        widgetsMatchAccent: widgetsMatchAccent,
        copyableSocials,
        discordWidgets: widgetPreviewFiltered ?? undefined,
        cryptoWidgets: cryptoPreviewData && cryptoPreviewData.length > 0 ? { wallets: cryptoPreviewData } : undefined,
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
        githubWidgets: githubPreviewFiltered ?? undefined,
        showGithubWidgets: selectedGithubWidgetsCsv || undefined,
        showAudioPlayer: showAudioPlayerValue,
        audioVisualizerStyle: audioVisualizerStyleValue || undefined,
        audioTracks: audioTracksValue.length > 0 ? audioTracksValue : undefined,
      } satisfies Profile)
    : null), [
    baseProfileForPreview,
    discordAvatarUrl,
    slugValue,
    deferredTagline,
    deferredDescription,
    bannerValue,
    avatarUrlValue,
    terminalCommandEntries,
    backgroundTypeValue,
    backgroundUrlValue,
    backgroundAudioUrlValue,
    backgroundAudioStartSecondsValue,
    backgroundEffectValue,
    widgetsMatchAccent,
    copyableSocials,
    cardOpacityValue,
    cardBlurValue,
    cardEffectTilt,
    cardEffectSpotlight,
    cardEffectGlare,
    cardEffectMagneticBorder,
    widgetPreviewFiltered,
    widgetRobloxAccountAge,
    widgetRobloxProfile,
    cryptoPreviewData,
    githubPreviewFiltered,
    selectedGithubWidgetsCsv,
    showAudioPlayerValue,
    audioVisualizerStyleValue,
    audioTracksValue,
  ]);

  useProfileEditorPreviewSync(previewProfile, previewIframeRef);

  useEditorSectionUrlSync(activeEditorSection, setActiveEditorSection);

  useEditorSectionFocus(activeEditorSection, panelRef, { tab });

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
    setGithubUsernameInput((profile as { githubUsername?: string | null }).githubUsername ?? "");
    setWidgetGithubLastPush((profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("lastPush") ?? false);
    setWidgetGithubPublicRepos((profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("publicRepos") ?? false);
    setWidgetGithubContributions((profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("contributions") ?? false);
    setWidgetGithubProfile((profile as { showGithubWidgets?: string }).showGithubWidgets?.includes("profile") ?? false);
    {
      const w = getWalletInputsFromProfileRow(profile as CryptoWalletProfileInput);
      setCryptoWalletEthereum(w.ethereum);
      setCryptoWalletBitcoin(w.bitcoin);
      setCryptoWalletSolana(w.solana);
    }
    setWidgetsMatchAccent((profile as { widgetsMatchAccent?: boolean }).widgetsMatchAccent ?? false);
    setCopyableSocials((profile as { copyableSocials?: boolean }).copyableSocials ?? false);
    setCardOpacityValue((profile as { cardOpacity?: number }).cardOpacity ?? 95);
    setCardBlurValue((profile as { cardBlur?: string }).cardBlur ?? "sm");
    {
      const ce = resolveCardEffects(profile);
      setCardEffectTilt(ce.cardEffectTilt);
      setCardEffectSpotlight(ce.cardEffectSpotlight);
      setCardEffectGlare(ce.cardEffectGlare);
      setCardEffectMagneticBorder(ce.cardEffectMagneticBorder);
    }
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
    <ProfileEditorLayout
      tab={tab}
      setTab={setTab}
      activeEditorSection={activeEditorSection}
      onSelectSection={setActiveEditorSection}
      profileSlug={slugValue || profile.slug}
      previewIframeRef={previewIframeRef}
      previewIframeTitle={`Live preview: ${profile.name || slugValue || profile.slug}`}
      editorHeaderHint={
        activeEditorSection === "links" ? (
          <span className="text-xs text-[var(--muted)] hidden sm:inline">
            Use &quot;Save links&quot; below — ⌘/Ctrl+Enter saves this tab.
          </span>
        ) : null
      }
      editorScrollChildren={
        <div className="max-w-3xl space-y-3">
          <ProfileEditorOnboarding profile={profile} slugDraft={slugValue} />
          <div
            className={activeEditorSection === "links" ? "space-y-3" : "hidden"}
            aria-hidden={activeEditorSection !== "links"}
          >
            <SectionTip sectionId="links" profile={profile} activeSection={activeEditorSection} />
            <DashboardLinks
              profile={profile}
              embedded
              formId="profile-links-form"
              hasPremiumAccess={hasPremiumAccess}
              copyableSocials={copyableSocials}
              setCopyableSocials={setCopyableSocials}
            />
          </div>
          <form
            id="profile-editor-form"
            key={formKey}
            action={formAction}
            className={activeEditorSection === "links" ? "hidden space-y-5" : "space-y-5"}
            aria-hidden={activeEditorSection === "links"}
          >
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="terminalCommands" value={JSON.stringify(terminalCommandEntries.filter((e) => e.command.trim() || e.output.trim()))} />
            <div
              ref={panelRef}
              id="profile-editor-panel"
              tabIndex={-1}
              role="region"
              aria-label={editorSectionAriaLabel(activeEditorSection)}
              className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded-lg -m-0.5 p-0.5"
            >
              <ProfileEditorFormFields
                activeEditorSection={activeEditorSection}
                profile={profile}
                baseProfileForPreview={baseProfileForPreview}
                versions={initialVersions}
                onVersionsSaved={() => router.refresh()}
                onVersionsRestored={() => router.refresh()}
                onVersionsDeleted={() => router.refresh()}
                discordAvatarUrl={discordAvatarUrl}
                availableDiscordBadges={availableDiscordBadges}
                hasPremiumAccess={hasPremiumAccess}
                robloxLinked={robloxLinked}
                widgetPreviewFiltered={widgetPreviewFiltered}
                widgetsMatchAccent={widgetsMatchAccent}
                setWidgetsMatchAccent={setWidgetsMatchAccent}
                widgetCount={widgetCount}
                canEnableMore={canEnableMore}
                widgetAccountAge={widgetAccountAge}
                setWidgetAccountAge={setWidgetAccountAge}
                widgetJoined={widgetJoined}
                setWidgetJoined={setWidgetJoined}
                widgetServerCount={widgetServerCount}
                setWidgetServerCount={setWidgetServerCount}
                widgetServerInvite={widgetServerInvite}
                setWidgetServerInvite={setWidgetServerInvite}
                widgetRobloxAccountAge={widgetRobloxAccountAge}
                setWidgetRobloxAccountAge={setWidgetRobloxAccountAge}
                widgetRobloxProfile={widgetRobloxProfile}
                setWidgetRobloxProfile={setWidgetRobloxProfile}
                githubUsernameInput={githubUsernameInput}
                setGithubUsernameInput={setGithubUsernameInput}
                widgetGithubLastPush={widgetGithubLastPush}
                setWidgetGithubLastPush={setWidgetGithubLastPush}
                widgetGithubPublicRepos={widgetGithubPublicRepos}
                setWidgetGithubPublicRepos={setWidgetGithubPublicRepos}
                widgetGithubContributions={widgetGithubContributions}
                setWidgetGithubContributions={setWidgetGithubContributions}
                widgetGithubProfile={widgetGithubProfile}
                setWidgetGithubProfile={setWidgetGithubProfile}
                cryptoWalletEthereum={cryptoWalletEthereum}
                setCryptoWalletEthereum={setCryptoWalletEthereum}
                cryptoWalletBitcoin={cryptoWalletBitcoin}
                setCryptoWalletBitcoin={setCryptoWalletBitcoin}
                cryptoWalletSolana={cryptoWalletSolana}
                setCryptoWalletSolana={setCryptoWalletSolana}
                discordInviteInput={discordInviteInput}
                setDiscordInviteInput={setDiscordInviteInput}
                githubPreviewFiltered={githubPreviewFiltered}
                selectedGithubWidgetsCsv={selectedGithubWidgetsCsv}
                cryptoPreviewData={cryptoPreviewData}
                slugValue={slugValue}
                setSlugValue={setSlugValue}
                slugCheck={slugCheck}
                setSlugCheck={setSlugCheck}
                debouncedCheckSlug={debouncedCheckSlug}
                taglineValue={taglineValue}
                setTaglineValue={setTaglineValue}
                descriptionValue={descriptionValue}
                setDescriptionValue={setDescriptionValue}
                bannerValue={bannerValue}
                setBannerValue={setBannerValue}
                avatarUrlValue={avatarUrlValue}
                setAvatarUrlValue={setAvatarUrlValue}
                avatarUploading={avatarUploading}
                setAvatarUploading={setAvatarUploading}
                avatarUploadError={avatarUploadError}
                setAvatarUploadError={setAvatarUploadError}
                avatarFileInputRef={avatarFileInputRef}
                terminalCommandEntries={terminalCommandEntries}
                setTerminalCommandEntries={setTerminalCommandEntries}
                cardEffectTilt={cardEffectTilt}
                setCardEffectTilt={setCardEffectTilt}
                cardEffectSpotlight={cardEffectSpotlight}
                setCardEffectSpotlight={setCardEffectSpotlight}
                cardEffectGlare={cardEffectGlare}
                setCardEffectGlare={setCardEffectGlare}
                cardEffectMagneticBorder={cardEffectMagneticBorder}
                setCardEffectMagneticBorder={setCardEffectMagneticBorder}
                cardOpacityValue={cardOpacityValue}
                setCardOpacityValue={setCardOpacityValue}
                cardBlurValue={cardBlurValue}
                setCardBlurValue={setCardBlurValue}
                customFontValue={customFontValue}
                setCustomFontValue={setCustomFontValue}
                customFontUrlValue={customFontUrlValue}
                setCustomFontUrlValue={setCustomFontUrlValue}
                customFontUploading={customFontUploading}
                setCustomFontUploading={setCustomFontUploading}
                customFontUploadError={customFontUploadError}
                setCustomFontUploadError={setCustomFontUploadError}
                customFontFileRef={customFontFileRef}
                cursorStyleValue={cursorStyleValue}
                setCursorStyleValue={setCursorStyleValue}
                cursorImageUrlValue={cursorImageUrlValue}
                setCursorImageUrlValue={setCursorImageUrlValue}
                cursorUploading={cursorUploading}
                setCursorUploading={setCursorUploading}
                cursorUploadError={cursorUploadError}
                setCursorUploadError={setCursorUploadError}
                cursorFileRef={cursorFileRef}
                backgroundTypeValue={backgroundTypeValue}
                setBackgroundTypeValue={setBackgroundTypeValue}
                backgroundUrlValue={backgroundUrlValue}
                setBackgroundUrlValue={setBackgroundUrlValue}
                backgroundUploading={backgroundUploading}
                backgroundUploadError={backgroundUploadError}
                setBackgroundUploadError={setBackgroundUploadError}
                backgroundFileInputRef={backgroundFileInputRef}
                backgroundAudioUrlValue={backgroundAudioUrlValue}
                setBackgroundAudioUrlValue={setBackgroundAudioUrlValue}
                backgroundAudioUploading={backgroundAudioUploading}
                backgroundAudioUploadError={backgroundAudioUploadError}
                backgroundAudioFileRef={backgroundAudioFileRef}
                backgroundAudioStartSecondsValue={backgroundAudioStartSecondsValue}
                setBackgroundAudioStartSecondsValue={setBackgroundAudioStartSecondsValue}
                backgroundDragOver={backgroundDragOver}
                setBackgroundDragOver={setBackgroundDragOver}
                audioDragOver={audioDragOver}
                setAudioDragOver={setAudioDragOver}
                backgroundEffectValue={backgroundEffectValue}
                setBackgroundEffectValue={setBackgroundEffectValue}
                handleBackgroundFileUpload={handleBackgroundFileUpload}
                handleBackgroundAudioUpload={handleBackgroundAudioUpload}
                showAudioPlayerValue={showAudioPlayerValue}
                setShowAudioPlayerValue={setShowAudioPlayerValue}
                audioVisualizerStyleValue={audioVisualizerStyleValue}
                setAudioVisualizerStyleValue={setAudioVisualizerStyleValue}
                audioTracksValue={audioTracksValue}
                setAudioTracksValue={setAudioTracksValue}
                audioTrackUploading={audioTrackUploading}
                audioTrackUploadError={audioTrackUploadError}
                audioTrackFileRef={audioTrackFileRef}
                audioTracksDragOver={audioTracksDragOver}
                setAudioTracksDragOver={setAudioTracksDragOver}
                editingTrackIndex={editingTrackIndex}
                setEditingTrackIndex={setEditingTrackIndex}
                editingTrackTitle={editingTrackTitle}
                setEditingTrackTitle={setEditingTrackTitle}
                draggedTrackIndex={draggedTrackIndex}
                setDraggedTrackIndex={setDraggedTrackIndex}
                handleAudioTrackUpload={handleAudioTrackUpload}
                moveTrack={moveTrack}
              />
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
        </div>
      }
    />
  );
}
