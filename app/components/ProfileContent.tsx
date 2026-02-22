import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Cake, Eye, Briefcase, Translate, Target, Check, Shield } from "@phosphor-icons/react/dist/ssr";
import type { Profile } from "@/lib/profiles";

const profileMetaIconProps = { size: 14, weight: "regular" as const, className: "shrink-0 text-current" };
import { getDiscordBadgeInfo } from "@/lib/discord-badges";
import { getBadgeIcon } from "@/lib/badge-icons";
import ProfileLinks from "@/app/components/ProfileLinks";
import ProfileDescription from "@/app/components/ProfileDescription";
import ProfileTags from "@/app/components/ProfileTags";
import ProfileQuote from "@/app/components/ProfileQuote";
import TaglineWithEasterEgg from "@/app/components/TaglineWithEasterEgg";
import ProfileCommandBar from "@/app/components/ProfileCommandBar";
import ProfileVouches from "@/app/components/ProfileVouches";
import ProfileReportButton from "@/app/components/ProfileReportButton";
import ProfileAudioPlayer from "@/app/components/ProfileAudioPlayer";
import ProfileGalleryButton from "@/app/components/ProfileGalleryButton";
import ProfileBlogButton from "@/app/components/ProfileBlogButton";
import DiscordPresenceDisplay from "@/app/components/DiscordPresenceDisplay";
import type { VouchedByUser } from "@/lib/member-profiles";
import { getBirthdayCountdown } from "@/lib/birthday-countdown";
import { formatLastSeen } from "@/lib/discord-lastseen";
import { SITE_URL } from "@/lib/site";
import {
  CUSTOM_BADGE_COLORS,
  BANNER_STYLES,
  GRADIENT_BANNER_STYLES,
  getThemeClass,
} from "@/lib/profile-themes";

function resolveMediaUrl(url: string): string {
  if (!url?.trim()) return "";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${SITE_URL.replace(/\/$/, "")}${u}`;
  return u;
}

const CARD_STYLES = ["default", "sharp", "glass", "neon", "minimal", "elevated"] as const;
const CUSTOM_FONTS = ["jetbrains-mono", "fira-code", "space-mono"] as const;
const AVATAR_SHAPES = ["circle", "rounded", "square", "soft", "hexagon"] as const;
const LAYOUT_DENSITIES = ["default", "compact", "spacious"] as const;
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
        className={`leading-tight whitespace-pre font-mono mt-1 mb-3 overflow-x-auto overflow-y-hidden rounded-lg py-2 px-1 ${bannerClass}`}
        style={preStyle}
        aria-hidden
      >
        {banner}
      </pre>
    );
  }
  return (
    <pre
      className={`leading-tight whitespace-pre font-mono mt-1 mb-3 overflow-x-auto overflow-y-hidden rounded-lg py-2 px-1 ${bannerClass}`}
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
  mutualVouchers?: VouchedByUser[];
  currentUserHasVouched: boolean;
  canVouch: boolean;
}

interface SimilarProfile {
  slug: string;
  name: string;
}

interface ProfileContentProps {
  profile: Profile;
  vouches?: ProfileVouchesData;
  similarProfiles?: SimilarProfile[];
  mutualGuilds?: string[];
  /** Show report button (when viewing others). False only when viewing own profile. */
  canReport?: boolean;
  /** Can actually submit (requires login) */
  canSubmitReport?: boolean;
}

export default function ProfileContent({ profile, vouches, similarProfiles, mutualGuilds, canReport, canSubmitReport }: ProfileContentProps) {
  const themeClass = getThemeClass(profile.accentColor);
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
  const avatarClass =
    avatarShape === "rounded"
      ? "rounded-lg"
      : avatarShape === "square"
        ? "rounded-none"
        : avatarShape === "soft"
          ? "rounded-xl"
          : avatarShape === "hexagon"
            ? "profile-avatar-hexagon"
            : "rounded-full";
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
  const customFontUrlResolved = profile.customFontUrl ? resolveMediaUrl(profile.customFontUrl) : "";
  const animationClass =
    profile.animationPreset && ANIMATION_PRESETS.includes(profile.animationPreset as (typeof ANIMATION_PRESETS)[number]) && profile.animationPreset !== "none"
      ? `profile-animate-${profile.animationPreset}`
      : "";
  const useTerminalLayout = Boolean(profile.useTerminalLayout && (profile.terminalCommands?.length || profile.terminalTitle != null));
  const cardOpacity = profile.cardOpacity != null ? Math.max(50, Math.min(100, profile.cardOpacity)) : 95;
  const isMinimalist = profile.pageTheme === "minimalist-light" || profile.pageTheme === "minimalist-dark";

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
      className={`relative z-10 w-full max-h-[calc(100vh-1.5rem)] overflow-auto ${isMinimalist ? "max-w-md" : "max-w-2xl"} ${themeClass} ${fontClass}`}
    >
      <article
        className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isMinimalist ? "profile-minimalist-card border-[var(--border)]/60 shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border)]" : "rounded-xl border-[var(--border)] shadow-2xl shadow-black/50 backdrop-blur-sm hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(6,182,212,0.05)]"} ${!isMinimalist ? cardClass : ""} ${densityClass} ${animationClass}`}
        style={{ backgroundColor: `color-mix(in srgb, var(--surface) ${cardOpacity}%, transparent)` }}
        aria-labelledby="profile-name"
      >
        <div className={`flex items-center gap-2 px-3 py-2 sm:px-4 ${isMinimalist ? "border-b border-[var(--border)]/40 bg-transparent" : "border-b border-[var(--border)] bg-[var(--bg)]/90"}`}>
          {isMinimalist ? (
            <>
              <span className="flex-1 min-w-0" />
              {canReport !== false && <ProfileReportButton slug={profile.slug} canSubmit={canSubmitReport ?? false} />}
            </>
          ) : (
            <>
              <div className="flex gap-1.5 items-center shrink-0">
                <span className="h-2.5 w-2.5 min-w-[10px] min-h-[10px] rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.4)]" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-[#eab308] shadow-[0_0_6px_rgba(234,179,8,0.4)]" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.4)]" aria-hidden />
              </div>
              <span className="ml-2 font-mono text-xs text-[var(--muted)] truncate flex-1 min-w-0">
                {profile.slug}.txt
              </span>
              {canReport !== false && <ProfileReportButton slug={profile.slug} canSubmit={canSubmitReport ?? false} />}
            </>
          )}
        </div>
        <div className={`profile-content-inner border-t ${isMinimalist ? "profile-minimalist pt-6 px-8 pb-8 sm:pt-8 sm:px-10 sm:pb-10 text-[16px] border-[var(--border)]/30" : "pt-2 px-3 pb-3 sm:pt-3 sm:px-4 sm:pb-4 border-[var(--border)]/50 font-mono text-sm sm:text-sm"}`}>
          {!isMinimalist && (
            <p className="text-[var(--terminal)]">
              <span className="text-[var(--muted)]">{prompt}</span> cat {profile.slug}.txt
            </p>
          )}
          {profile.banner && (
            <BannerPre banner={profile.banner} bannerClass={bannerClass} bannerSmall={profile.bannerSmall} />
          )}
          <div className={`flex items-center ${isMinimalist ? "mt-6 gap-8" : "mt-3 gap-4"}`}>
            {profile.avatar && (
              profile.avatar.includes("cdn.discordapp.com") ? (
                <Image
                  src={profile.avatar}
                  alt=""
                  width={isMinimalist ? 96 : 64}
                  height={isMinimalist ? 96 : 64}
                  className={`profile-avatar shrink-0 border object-cover transition-all duration-300 ${isMinimalist ? "h-20 w-20 sm:h-24 sm:w-24 border-[var(--border)]/40 ring-2 ring-[var(--surface)]/80 rounded-2xl hover:ring-[var(--accent)]/20" : "h-16 w-16 border-2 border-[var(--border)] ring-2 ring-[var(--surface)] shadow-lg hover:ring-[var(--accent)]/30 hover:border-[var(--accent)]/40"} ${avatarClass}`}
                />
              ) : (
                <Image
                  src={profile.avatar}
                  alt=""
                  width={isMinimalist ? 96 : 64}
                  height={isMinimalist ? 96 : 64}
                  className={`profile-avatar shrink-0 border object-cover transition-all duration-300 ${isMinimalist ? "h-20 w-20 sm:h-24 sm:w-24 border-[var(--border)]/40 ring-2 ring-[var(--surface)]/80 rounded-2xl hover:ring-[var(--accent)]/20" : "h-16 w-16 border-2 border-[var(--border)] ring-2 ring-[var(--surface)] shadow-lg hover:ring-[var(--accent)]/30 hover:border-[var(--accent)]/40"} ${avatarClass}`}
                  unoptimized
                />
              )
            )}
            <div className="profile-name-block min-w-0 flex-1">
              <h1 id="profile-name" className={`text-[var(--foreground)] tracking-tight flex items-center gap-2 flex-wrap ${isMinimalist ? "text-2xl sm:text-3xl font-medium tracking-[-0.03em]" : "text-xl font-semibold"}`}>
                {profile.nameGreeting?.trim() && (
                  <span className="text-[var(--muted)] font-normal">{profile.nameGreeting.trim()} </span>
                )}
                {profile.name}
                {(profile.verified || profile.staff || (profile.customBadges?.length ?? 0) > 0 || (profile.discordBadges?.length ?? 0) > 0) && (
                  <span className="inline-flex items-center gap-1.5 ml-1.5 flex-wrap">
                    {profile.verified && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-xs font-medium text-[var(--accent)]" title="Recognized or notable member of the community">
                        <Check size={14} weight="bold" className="shrink-0" aria-hidden />
                        Verified
                      </span>
                    )}
                    {profile.staff && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400" title="Server staff — member of the Dread.lol team">
                        <Shield size={14} weight="fill" className="shrink-0" aria-hidden />
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
                      const info = getDiscordBadgeInfo(key);
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
              {((profile.location?.trim() || profile.timezone?.trim() || profile.timezoneRange?.trim() || profile.birthday?.trim() || profile.languages?.trim() || profile.availability?.trim()) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  {profile.location?.trim() && (
                    <p className="text-xs text-[var(--muted)] inline-flex items-center gap-1.5">
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
                        <p className="text-xs text-[var(--muted)] inline-flex items-center gap-1.5" title={`Current time in ${profile.timezone}`}>
                          <Clock {...profileMetaIconProps} aria-hidden />
                          {localTime}
                        </p>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                  {profile.timezoneRange?.trim() && (
                    <p className="text-xs text-[var(--muted)] inline-flex items-center gap-1.5" title="Typical availability">
                      <Clock {...profileMetaIconProps} aria-hidden />
                      {profile.timezoneRange.trim()}
                    </p>
                  )}
                  {profile.birthday?.trim() && (() => {
                    const countdown = getBirthdayCountdown(profile.birthday);
                    if (!countdown) return null;
                    return (
                      <p className="text-xs text-[var(--muted)] inline-flex items-center gap-1.5">
                        <Cake {...profileMetaIconProps} aria-hidden />
                        {countdown}
                      </p>
                    );
                  })()}
                  {profile.languages?.trim() && (
                    <p className="text-xs text-[var(--muted)] inline-flex items-center gap-1.5">
                      <Translate {...profileMetaIconProps} aria-hidden />
                      {profile.languages.trim()}
                    </p>
                  )}
                  {profile.availability?.trim() && (
                    <p className="text-xs text-[var(--accent)] inline-flex items-center gap-1.5">
                      <Briefcase {...profileMetaIconProps} aria-hidden />
                      {profile.availability.trim()}
                    </p>
                  )}
                </div>
              )) || null}
              {profile.currentFocus?.trim() && (
                <p className="text-xs text-[var(--muted)] mt-1 inline-flex items-center gap-1.5">
                  <Target {...profileMetaIconProps} aria-hidden />
                  {profile.currentFocus.trim()}
                </p>
              )}
              {profile.discordPresence && (
                <div className="mt-2.5">
                  <DiscordPresenceDisplay
                    presence={profile.discordPresence}
                    style={
                      (profile.discordPresenceStyle as "pills" | "minimal" | "stacked" | "inline" | "widget") ?? "widget"
                    }
                  />
                </div>
              )}
              {profile.discordLastSeen && (
                <p className="text-xs text-[var(--muted)] mt-1.5">
                  Last active in Discord {formatLastSeen(new Date(profile.discordLastSeen))}
                </p>
              )}
              {mutualGuilds && mutualGuilds.length > 0 && (
                <p className="text-xs text-[var(--muted)] mt-1.5">
                  We&apos;re both in: {mutualGuilds.join(", ")}
                </p>
              )}
            </div>
          </div>
          {profile.description && (
            <ProfileDescription text={profile.description} />
          )}
          {profile.tags && profile.tags.length > 0 && (
            <ProfileTags tags={profile.tags} />
          )}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-1.5 text-xs text-[var(--accent)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {profile.quote && <ProfileQuote quote={profile.quote} />}
          <ProfileLinks
            websiteUrl={profile.websiteUrl}
            discord={profile.discord}
            roblox={profile.roblox}
            links={profile.links}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <ProfileBlogButton slug={profile.slug} />
            <ProfileGalleryButton slug={profile.slug} />
          </div>
          {profile.showAudioPlayer && profile.audioTracks && profile.audioTracks.length > 0 && (
            <ProfileAudioPlayer tracks={profile.audioTracks} visualizerStyle={profile.audioVisualizerStyle} visualizerAnimation={profile.audioVisualizerAnimation} />
          )}
          {similarProfiles && similarProfiles.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
              <p className="text-xs font-medium text-[var(--muted)] mb-2">Similar profiles</p>
              <div className="flex flex-wrap gap-2">
                {similarProfiles.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/${p.slug}`}
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--bg)]/50 px-2 py-1 text-sm text-[var(--foreground)]/90 hover:bg-[var(--accent)]/15 hover:text-[var(--accent)] border border-[var(--border)]/50 transition-colors"
                  >
                    {p.name || p.slug}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {vouches && (
            <ProfileVouches
              slug={vouches.slug}
              count={vouches.count}
              vouchedBy={vouches.vouchedBy}
              mutualVouchers={vouches.mutualVouchers}
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
