import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Cake, Eye } from "@phosphor-icons/react/dist/ssr";
import type { Profile } from "@/lib/profiles";

const profileMetaIconProps = { size: 14, weight: "regular" as const, className: "shrink-0 text-current" };
import { DISCORD_BADGE_INFO, type DiscordBadgeKey } from "@/lib/discord-badges";
import { getBadgeIcon } from "@/lib/badge-icons";
import ProfileLinks from "@/app/components/ProfileLinks";
import ProfileDescription from "@/app/components/ProfileDescription";
import ProfileTags from "@/app/components/ProfileTags";
import ProfileQuote from "@/app/components/ProfileQuote";
import TaglineWithEasterEgg from "@/app/components/TaglineWithEasterEgg";
import ProfileCommandBar from "@/app/components/ProfileCommandBar";
import ProfileVouches from "@/app/components/ProfileVouches";
import ProfileAudioPlayer from "@/app/components/ProfileAudioPlayer";
import ProfileGalleryButton from "@/app/components/ProfileGalleryButton";
import type { VouchedByUser } from "@/lib/member-profiles";
import { getBirthdayCountdown } from "@/lib/birthday-countdown";
import { SITE_URL } from "@/lib/site";

function resolveMediaUrl(url: string): string {
  if (!url?.trim()) return "";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${SITE_URL.replace(/\/$/, "")}${u}`;
  return u;
}

const ACCENT_THEMES = ["cyan", "green", "purple", "orange", "rose"] as const;
/** Preset class names for custom badge colors (key = badge.color value from admin). */
const CUSTOM_BADGE_COLORS: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  purple: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  cyan: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};
const CARD_STYLES = ["default", "sharp", "glass"] as const;
const BANNER_STYLES = ["accent", "fire", "cyan", "green", "purple", "orange", "rose"] as const;
const CUSTOM_FONTS = ["jetbrains-mono", "fira-code", "space-mono"] as const;
const AVATAR_SHAPES = ["circle", "rounded"] as const;
const LAYOUT_DENSITIES = ["default", "compact", "spacious"] as const;
const CURSOR_STYLES = ["default", "crosshair", "pointer", "text", "grab", "minimal", "beam"] as const;
const ANIMATION_PRESETS = [
  "none",
  "fade-in",
  "slide-up",
  "scale-in",
  "bounce-in",
  "flip-in",
  "slide-in-left",
  "zoom-bounce",
  "blur-in",
  "neon-glow",
  "drift-in",
  "stagger",
  "float",
  "pulse-border",
  "glow",
  "shimmer",
] as const;

/** Gradient styles use background-clip: text, which makes space chars invisible. Render spaces as 1ch spans. */
const GRADIENT_BANNER_STYLES = ["fire", "cyan", "green", "purple", "orange", "rose"] as const;

function BannerPre({
  banner,
  bannerClass,
  bannerSmall,
}: {
  banner: string;
  bannerClass: string;
  bannerSmall?: boolean;
}) {
  const isGradient = GRADIENT_BANNER_STYLES.some((s) => bannerClass === `banner-style-${s}`);
  const preStyle = {
    fontSize: bannerSmall ? "clamp(2px, 0.5vh, 5px)" : "clamp(5px, 1.1vh, 10px)",
    lineHeight: 1.12,
    maxHeight: "min(260px, 32vh)",
    whiteSpace: "pre" as const,
  };
  if (!isGradient) {
    return (
      <pre
        className={`leading-tight whitespace-pre font-mono mt-1.5 mb-4 overflow-x-auto overflow-y-hidden rounded-lg py-2 px-1 ${bannerClass}`}
        style={preStyle}
        aria-hidden
      >
        {banner}
      </pre>
    );
  }
  return (
    <pre
      className={`leading-tight whitespace-pre font-mono mt-1.5 mb-4 overflow-x-auto overflow-y-hidden rounded-lg py-2 px-1 ${bannerClass}`}
      style={preStyle}
      aria-hidden
    >
      {banner.split("").map((char, i) =>
        char === " " ? (
          <span
            key={i}
            className={bannerClass}
            style={{
              display: "inline-block",
              width: "1ch",
              WebkitBackgroundClip: "padding-box",
              backgroundClip: "padding-box",
            }}
            aria-hidden
          />
        ) : (
          char
        )
      )}
    </pre>
  );
}

export interface ProfileVouchesData {
  slug: string;
  count: number;
  vouchedBy: VouchedByUser[];
  currentUserHasVouched: boolean;
  canVouch: boolean;
}

interface ProfileContentProps {
  profile: Profile;
  vouches?: ProfileVouchesData;
}

export default function ProfileContent({ profile, vouches }: ProfileContentProps) {
  const themeClass =
    profile.accentColor && ACCENT_THEMES.includes(profile.accentColor as (typeof ACCENT_THEMES)[number])
      ? `profile-theme-${profile.accentColor}`
      : "";
  const prompt = (profile.terminalPrompt?.trim() || "$").slice(0, 8);
  const cardClass =
    profile.cardStyle && CARD_STYLES.includes(profile.cardStyle as (typeof CARD_STYLES)[number]) && profile.cardStyle !== "default"
      ? `profile-card-${profile.cardStyle}`
      : "";
  const bannerStyle =
    profile.bannerStyle && BANNER_STYLES.includes(profile.bannerStyle as (typeof BANNER_STYLES)[number])
      ? profile.bannerStyle
      : profile.bannerAnimatedFire
        ? "fire"
        : "accent";
  const bannerClass = `banner-style-${bannerStyle}`;
  const avatarShape =
    profile.avatarShape && AVATAR_SHAPES.includes(profile.avatarShape as (typeof AVATAR_SHAPES)[number])
      ? profile.avatarShape
      : "circle";
  const avatarClass = avatarShape === "rounded" ? "rounded-lg" : "rounded-full";
  const density =
    profile.layoutDensity && LAYOUT_DENSITIES.includes(profile.layoutDensity as (typeof LAYOUT_DENSITIES)[number])
      ? profile.layoutDensity
      : "default";
  const densityClass = density !== "default" ? `profile-density-${density}` : "";
  const fontClass =
    profile.customFontUrl
      ? "profile-font-custom"
      : profile.customFont && CUSTOM_FONTS.includes(profile.customFont as (typeof CUSTOM_FONTS)[number])
        ? `profile-font-${profile.customFont}`
        : "";
  const cursorClass =
    profile.cursorImageUrl
      ? ""
      : profile.cursorStyle && CURSOR_STYLES.includes(profile.cursorStyle as (typeof CURSOR_STYLES)[number]) && profile.cursorStyle !== "default"
        ? `profile-cursor-${profile.cursorStyle}`
        : "";
  const cursorStyleInline =
    profile.cursorImageUrl
      ? { cursor: `url("${resolveMediaUrl(profile.cursorImageUrl).replace(/"/g, "%22")}") 0 0, auto` }
      : undefined;
  const customFontUrlResolved = profile.customFontUrl ? resolveMediaUrl(profile.customFontUrl) : "";
  const animationClass =
    profile.animationPreset && ANIMATION_PRESETS.includes(profile.animationPreset as (typeof ANIMATION_PRESETS)[number]) && profile.animationPreset !== "none"
      ? `profile-animate-${profile.animationPreset}`
      : "";
  const useTerminalLayout = Boolean(profile.useTerminalLayout && (profile.terminalCommands?.length || profile.terminalTitle != null));
  const cardOpacity = profile.cardOpacity != null ? Math.max(50, Math.min(100, profile.cardOpacity)) : 95;

  return (
    <>
      {customFontUrlResolved && (
        <style
          dangerouslySetInnerHTML={{
            __html: `@font-face{font-family:profile-custom-font;src:url("${customFontUrlResolved.replace(/"/g, "%22")}");}.profile-font-custom{font-family:profile-custom-font,ui-monospace,monospace}`,
          }}
        />
      )}
    <div
      className={`relative z-10 w-full max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-auto ${themeClass} ${fontClass} ${cursorClass}`}
      style={cursorStyleInline}
    >
      <article
        className={`rounded-xl border border-[var(--border)] shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden transition-shadow duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(6,182,212,0.05)] ${cardClass} ${densityClass} ${animationClass}`}
        style={{ backgroundColor: `color-mix(in srgb, var(--surface) ${cardOpacity}%, transparent)` }}
        aria-labelledby="profile-name"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/90 px-3 py-2.5 sm:px-4">
          <div className="flex gap-1.5 items-center shrink-0">
            <Link
              href="/"
              className="h-2.5 w-2.5 min-w-[10px] min-h-[10px] rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.4)] transition-opacity hover:opacity-80 focus:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--surface)] cursor-pointer block"
              aria-label="Back to home"
            />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308] shadow-[0_0_6px_rgba(234,179,8,0.4)]" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.4)]" aria-hidden />
          </div>
          <span className="ml-2 font-mono text-xs text-[var(--muted)] truncate flex-1 min-w-0">
            {profile.slug}.txt
          </span>
        </div>
        <div className="p-3 font-mono text-sm sm:p-4 sm:text-sm border-t border-[var(--border)]/50 profile-content-inner">
          <p className="text-[var(--terminal)]">
            <span className="text-[var(--muted)]">{prompt}</span> cat {profile.slug}.txt
          </p>
          {profile.banner && (
            <BannerPre banner={profile.banner} bannerClass={bannerClass} bannerSmall={profile.bannerSmall} />
          )}
          <div className="mt-4 flex items-center gap-4">
            {profile.avatar && (
              profile.avatar.includes("cdn.discordapp.com") ? (
                <Image
                  src={profile.avatar}
                  alt=""
                  width={64}
                  height={64}
                  className={`profile-avatar h-16 w-16 shrink-0 border-2 border-[var(--border)] object-cover ring-2 ring-[var(--surface)] shadow-lg transition-all duration-200 hover:ring-[var(--accent)]/30 hover:border-[var(--accent)]/40 ${avatarClass}`}
                />
              ) : (
                <Image
                  src={profile.avatar}
                  alt=""
                  width={64}
                  height={64}
                  className={`profile-avatar h-16 w-16 shrink-0 border-2 border-[var(--border)] object-cover ring-2 ring-[var(--surface)] shadow-lg transition-all duration-200 hover:ring-[var(--accent)]/30 hover:border-[var(--accent)]/40 ${avatarClass}`}
                  unoptimized
                />
              )
            )}
            <div className="profile-name-block min-w-0 flex-1">
              <h1 id="profile-name" className="text-xl font-semibold text-[var(--foreground)] tracking-tight flex items-center gap-2 flex-wrap">
                {profile.nameGreeting?.trim() && (
                  <span className="text-[var(--muted)] font-normal">{profile.nameGreeting.trim()} </span>
                )}
                {profile.name}
                {(profile.verified || profile.staff || (profile.customBadges?.length ?? 0) > 0 || (profile.discordBadges?.length ?? 0) > 0) && (
                  <span className="inline-flex items-center gap-1.5 ml-1.5 flex-wrap">
                    {profile.verified && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-xs font-medium text-[var(--accent)]" title="Recognized or notable member of the community">
                        <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                        Verified
                      </span>
                    )}
                    {profile.staff && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400" title="Server staff — member of the Dread.lol team">
                        <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                        </svg>
                        Staff
                      </span>
                    )}
                    {profile.customBadges?.map((b) => {
                      const isHex = b.color?.startsWith("#");
                      const preset = !isHex && b.color ? CUSTOM_BADGE_COLORS[b.color] : null;
                      const className = preset
                        ? `inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${preset}`
                        : "inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-xs font-medium text-[var(--accent)]";
                      const style =
                        isHex && b.color
                          ? { backgroundColor: `${b.color}20`, color: b.color }
                          : undefined;
                      return (
                        <span key={b.id} className={className} style={style} title={b.description || b.label}>
                          {b.imageUrl && (b.imageUrl.startsWith("/") || b.imageUrl.startsWith("http")) ? (
                            <Image src={b.imageUrl} alt="" width={14} height={14} className="shrink-0 object-contain inline-block align-middle" unoptimized />
                          ) : b.iconName ? (
                            getBadgeIcon(b.iconName)
                          ) : null}
                          {b.label}
                        </span>
                      );
                    })}
                    {profile.discordBadges?.map((key) => {
                      const info = (key as DiscordBadgeKey) in DISCORD_BADGE_INFO ? DISCORD_BADGE_INFO[key as DiscordBadgeKey] : null;
                      if (!info) return null;
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 rounded-md bg-[#5865F2]/15 px-1.5 py-0.5 text-xs font-medium text-[#5865F2]"
                          title={info.title}
                        >
                          {info.label}
                        </span>
                      );
                    })}
                  </span>
                )}
              </h1>
              {profile.pronouns?.trim() && (
                <p className="text-xs text-[var(--muted)] mt-0.5">{profile.pronouns.trim()}</p>
              )}
              {profile.tagline && (
                <TaglineWithEasterEgg
                  tagline={profile.tagline}
                  easterEggTaglineWord={profile.easterEggTaglineWord}
                  easterEggLink={profile.easterEggLink}
                />
              )}
              {profile.location?.trim() && (
                <p className="text-xs text-[var(--muted)] mt-0.5 inline-flex items-center gap-1.5">
                  <MapPin {...profileMetaIconProps} aria-hidden />
                  {profile.location.trim()}
                </p>
              )}
              {profile.timezone?.trim() && (() => {
                try {
                  const formatter = new Intl.DateTimeFormat(undefined, {
                    timeZone: profile.timezone.trim(),
                    timeStyle: "short",
                    hour12: true,
                  });
                  const localTime = formatter.format(new Date());
                  return (
                    <p className="text-xs text-[var(--muted)] mt-0.5 inline-flex items-center gap-1.5" title={`Current time in ${profile.timezone}`}>
                      <Clock {...profileMetaIconProps} aria-hidden />
                      {localTime}
                    </p>
                  );
                } catch {
                  return null;
                }
              })()}
              {profile.birthday?.trim() && (() => {
                const countdown = getBirthdayCountdown(profile.birthday);
                if (!countdown) return null;
                return (
                  <p className="text-xs text-[var(--muted)] mt-0.5 inline-flex items-center gap-1.5">
                    <Cake {...profileMetaIconProps} aria-hidden />
                    {countdown}
                  </p>
                );
              })()}
              {profile.discordPresence && (
                <div className="mt-2.5 flex flex-wrap items-center justify-start gap-2">
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      profile.discordPresence.status === "online"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : profile.discordPresence.status === "idle"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : profile.discordPresence.status === "dnd"
                            ? "bg-red-500/15 text-red-600 dark:text-red-400"
                            : "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        profile.discordPresence.status === "online"
                          ? "bg-emerald-500"
                          : profile.discordPresence.status === "idle"
                            ? "bg-amber-500"
                            : profile.discordPresence.status === "dnd"
                              ? "bg-red-500"
                              : "bg-zinc-500"
                      }`}
                      aria-hidden
                    />
                    <span className="capitalize">{profile.discordPresence.status}</span>
                  </span>
                  {profile.discordPresence.activities?.length > 0 &&
                    profile.discordPresence.activities.slice(0, 2).map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex items-start gap-1.5 rounded-lg border border-[var(--border)]/60 bg-[var(--bg)]/50 px-2.5 py-1 text-xs text-[var(--foreground)]/90 min-w-0"
                          title={[a.name, a.state, a.details].filter(Boolean).join(" · ")}
                        >
                          <span className="shrink-0 text-[var(--muted)] mt-0.5" aria-hidden>
                            {a.name.includes("Spotify") || a.name.includes("Listening") ? "♪" : "▶"}
                          </span>
                          <span className="break-words min-w-0">
                            {a.name}
                            {(a.state || a.details) && (
                              <span className="text-[var(--muted)]"> — {a.state || a.details}</span>
                            )}
                          </span>
                        </span>
                    ))}
                </div>
              )}
            </div>
          </div>
          {profile.description && (
            <ProfileDescription text={profile.description} />
          )}
          {profile.tags && profile.tags.length > 0 && (
            <ProfileTags tags={profile.tags} />
          )}
          {profile.quote && <ProfileQuote quote={profile.quote} />}
          <ProfileLinks
            discord={profile.discord}
            roblox={profile.roblox}
            links={profile.links}
          />
          <div className="mt-4">
            <ProfileGalleryButton slug={profile.slug} />
          </div>
          {profile.showAudioPlayer && profile.audioTracks && profile.audioTracks.length > 0 && (
            <ProfileAudioPlayer tracks={profile.audioTracks} />
          )}
          {vouches && (
            <ProfileVouches
              slug={vouches.slug}
              count={vouches.count}
              vouchedBy={vouches.vouchedBy}
              currentUserHasVouched={vouches.currentUserHasVouched}
              canVouch={vouches.canVouch}
            />
          )}
          {(profile.updatedAt || (profile.showPageViews && profile.viewCount != null)) && (
            <p className="mt-4 pt-3 border-t border-[var(--border)]/50 text-xs text-[var(--muted)] flex flex-wrap items-center gap-x-3 gap-y-1">
              {profile.updatedAt && <span>Last updated {profile.updatedAt}</span>}
              {profile.showPageViews && profile.viewCount != null && (
                <span className="inline-flex items-center gap-1">
                  <Eye {...profileMetaIconProps} aria-hidden />
                  {profile.viewCount} view{profile.viewCount !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          )}
        </div>
        {useTerminalLayout && (
          <ProfileCommandBar
            prompt={prompt}
            commands={profile.terminalCommands ?? []}
          />
        )}
      </article>
    </div>
    </>
  );
}
