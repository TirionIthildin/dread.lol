"use client";

import type { RefObject } from "react";
import Link from "next/link";
import {
  Crown,
  Lock,
  Image as ImageIcon,
  LayoutGrid,
  Grid2x2,
  Sparkle,
  Square,
  Video,
  X,
  Snowflake,
  CloudRain,
  Contrast,
  Monitor,
  Music,
  Upload,
  Play,
} from "lucide-react";
import SearchableSelect from "@/app/components/SearchableSelect";
import { MarketplacePreviewImage } from "@/app/components/MarketplacePreviewImage";
import type { ProfileRow } from "@/lib/db/schema";
import { ACCENT_COLOR_OPTIONS, ACCENT_COLORS, isValidHexColor } from "@/lib/profile-themes";
import {
  PROFILE_BG_TYPE_OPTIONS,
  PROFILE_BG_EFFECT_OPTIONS,
} from "@/app/[locale]/dashboard/profile-editor/constants";

export interface FunSectionProps {
  visible: boolean;
  profile: ProfileRow;
  hasPremiumAccess: boolean;
  cardOpacityValue: number;
  setCardOpacityValue: (v: number) => void;
  cardBlurValue: string;
  setCardBlurValue: (v: string) => void;
  customFontValue: string;
  setCustomFontValue: (v: string) => void;
  customFontUrlValue: string;
  setCustomFontUrlValue: (v: string) => void;
  customFontUploading: boolean;
  setCustomFontUploading: (v: boolean) => void;
  customFontUploadError: string | null;
  setCustomFontUploadError: (v: string | null) => void;
  customFontFileRef: RefObject<HTMLInputElement | null>;
  cursorStyleValue: string;
  setCursorStyleValue: (v: string) => void;
  cursorImageUrlValue: string;
  setCursorImageUrlValue: (v: string) => void;
  cursorUploading: boolean;
  setCursorUploading: (v: boolean) => void;
  cursorUploadError: string | null;
  setCursorUploadError: (v: string | null) => void;
  cursorFileRef: RefObject<HTMLInputElement | null>;
  backgroundTypeValue: string;
  setBackgroundTypeValue: (v: string) => void;
  backgroundUrlValue: string;
  setBackgroundUrlValue: (v: string) => void;
  backgroundUploading: boolean;
  backgroundUploadError: string | null;
  setBackgroundUploadError: (v: string | null) => void;
  backgroundFileInputRef: RefObject<HTMLInputElement | null>;
  backgroundAudioUrlValue: string;
  setBackgroundAudioUrlValue: (v: string) => void;
  backgroundAudioUploading: boolean;
  backgroundAudioUploadError: string | null;
  backgroundAudioFileRef: RefObject<HTMLInputElement | null>;
  backgroundAudioStartSecondsValue: string;
  setBackgroundAudioStartSecondsValue: (v: string) => void;
  backgroundDragOver: boolean;
  setBackgroundDragOver: (v: boolean) => void;
  audioDragOver: boolean;
  setAudioDragOver: (v: boolean) => void;
  backgroundEffectValue: string;
  setBackgroundEffectValue: (v: string) => void;
  handleBackgroundFileUpload: (file: File) => Promise<void>;
  handleBackgroundAudioUpload: (file: File) => Promise<void>;
}

const BG_OPTIONS = PROFILE_BG_TYPE_OPTIONS;
const BG_EFFECT_OPTIONS = PROFILE_BG_EFFECT_OPTIONS;

export function FunSection(props: FunSectionProps) {
  const {
    visible,
    profile,
    hasPremiumAccess,
    cardOpacityValue,
    setCardOpacityValue,
    cardBlurValue,
    setCardBlurValue,
    customFontValue,
    setCustomFontValue,
    customFontUrlValue,
    setCustomFontUrlValue,
    customFontUploading,
    setCustomFontUploading,
    customFontUploadError,
    setCustomFontUploadError,
    customFontFileRef,
    cursorStyleValue,
    setCursorStyleValue,
    cursorImageUrlValue,
    setCursorImageUrlValue,
    cursorUploading,
    setCursorUploading,
    cursorUploadError,
    setCursorUploadError,
    cursorFileRef,
    backgroundTypeValue,
    setBackgroundTypeValue,
    backgroundUrlValue,
    setBackgroundUrlValue,
    backgroundUploading,
    backgroundUploadError,
    setBackgroundUploadError,
    backgroundFileInputRef,
    backgroundAudioUrlValue,
    setBackgroundAudioUrlValue,
    backgroundAudioUploading,
    backgroundAudioUploadError,
    backgroundAudioFileRef,
    backgroundAudioStartSecondsValue,
    setBackgroundAudioStartSecondsValue,
    backgroundDragOver,
    setBackgroundDragOver,
    audioDragOver,
    setAudioDragOver,
    backgroundEffectValue,
    setBackgroundEffectValue,
    handleBackgroundFileUpload,
    handleBackgroundAudioUpload,
  } = props;
  return (
    <div className={visible ? "block space-y-3" : "hidden"}>
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
          <Crown size={20} className="fill-current text-[var(--accent)] shrink-0" />
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
              <Upload size={16} />
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
              <Upload size={16} />
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
            <Lock size={16} className="text-[var(--accent)] shrink-0" />
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
                <ImageIcon size={18} strokeWidth={1.5} className="text-[var(--accent)]" aria-hidden />
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
                  {opt === "grid" && <LayoutGrid size={16} />}
                  {opt === "gradient" && <Sparkle size={16} />}
                  {opt === "solid" && <Square size={16} />}
                  {opt === "dither" && <Grid2x2 size={16} />}
                  {opt === "image" && <ImageIcon size={16} />}
                  {opt === "video" && <Video size={16} />}
                  {opt === "grid" ? "Grid" : opt === "gradient" ? "Gradient" : opt === "solid" ? "Solid" : opt === "dither" ? "Animated" : opt === "image" ? "Image" : "Video"}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-[10px] text-[var(--muted)] block mb-1">Background effect</span>
              {!hasPremiumAccess && (
                <div className="mb-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-2 flex items-center gap-2">
                  <Lock size={16} className="text-[var(--accent)] shrink-0" />
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
                    {opt === "none" && <X size={16} />}
                    {opt === "snow" && <Snowflake size={16} />}
                    {opt === "rain" && <CloudRain size={16} />}
                    {opt === "blur" && <Contrast size={16} />}
                    {opt === "retro-computer" && <Monitor size={16} />}
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
                        <MarketplacePreviewImage
                          src={backgroundUrlValue}
                          alt=""
                          fill
                          className="object-cover"
                        />
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
                        <video src={backgroundUrlValue} muted playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent)]/20">
                            <Play size={24} className="fill-current text-[var(--accent)] ml-0.5" />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => backgroundFileInputRef.current?.click()}
                              disabled={backgroundUploading}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)]/80 px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent)] disabled:opacity-50"
                            >
                              <Upload size={16} strokeWidth={2.5} />
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => { setBackgroundTypeValue("none"); setBackgroundUrlValue(""); }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                            >
                              <X size={16} strokeWidth={2.5} />
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
                      <Upload size={32} className="text-[var(--accent)]" strokeWidth={1.5} />
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
                <Music size={18} className="text-[var(--accent)]" aria-hidden strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">Background audio</span>
            </div>
            <span className="text-[10px] text-[var(--muted)]">Ambient loop · separate from visual</span>
          </div>
          <div className="p-4 space-y-4">
            <input type="hidden" name="backgroundAudioUrl" value={backgroundAudioUrlValue} />
            {backgroundAudioUrlValue ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--accent)]/15 shrink-0">
                      <Music size={24} className="text-[var(--accent)] fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">Audio track loaded</p>
                      <p className="text-[10px] text-[var(--muted)]">Plays when visitor unlocks profile</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <audio src={backgroundAudioUrlValue} controls className="h-8 flex-1 min-w-0 max-w-full sm:max-w-[160px] opacity-90" preload="metadata" />
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => backgroundAudioFileRef.current?.click()}
                        disabled={backgroundAudioUploading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
                      >
                        <Upload size={14} strokeWidth={2.5} />
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackgroundAudioUrlValue("")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--warning)]/50 hover:text-[var(--warning)] transition-colors"
                      >
                        <X size={14} strokeWidth={2.5} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 px-4 py-3">
                  <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                    <span className="text-sm font-medium text-[var(--foreground)]">Start offset</span>
                    <span className="text-xs text-[var(--muted)] sm:ml-2">Skip intro (seconds from start)</span>
                    <input
                      type="number"
                      name="backgroundAudioStartSeconds"
                      min={0}
                      max={9999}
                      step={0.5}
                      value={backgroundAudioStartSecondsValue}
                      onChange={(e) => setBackgroundAudioStartSecondsValue(e.target.value)}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        if (Number.isNaN(v) || v < 0) setBackgroundAudioStartSecondsValue("");
                        else if (v > 9999) setBackgroundAudioStartSecondsValue("9999");
                      }}
                      placeholder="0"
                      className="mt-1 sm:mt-0 sm:ml-auto w-24 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm tabular-nums focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                    />
                  </label>
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
                  <Music size={28} className="text-[var(--accent)]" strokeWidth={1.5} />
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
  );
}
