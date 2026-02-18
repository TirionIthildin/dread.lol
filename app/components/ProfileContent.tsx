import Link from "next/link";
import Image from "next/image";
import type { Profile } from "@/lib/profiles";
import { DISCORD_BADGE_INFO, type DiscordBadgeKey } from "@/lib/discord-badges";
import ProfileLinks from "@/app/components/ProfileLinks";
import ProfileDescription from "@/app/components/ProfileDescription";
import ProfileTags from "@/app/components/ProfileTags";
import ProfileStatus from "@/app/components/ProfileStatus";
import ProfileQuote from "@/app/components/ProfileQuote";
import TaglineWithEasterEgg from "@/app/components/TaglineWithEasterEgg";
import ProfileCommandBar from "@/app/components/ProfileCommandBar";
import ProfileVouches from "@/app/components/ProfileVouches";
import type { VouchedByUser } from "@/lib/member-profiles";
import { getBirthdayCountdown } from "@/lib/birthday-countdown";

const ACCENT_THEMES = ["cyan", "green", "purple", "orange", "rose"] as const;
const CARD_STYLES = ["default", "sharp", "glass"] as const;
const BANNER_STYLES = ["accent", "fire", "cyan", "green", "purple", "orange", "rose"] as const;
const DISPLAY_STATUSES = ["online", "idle", "busy", "offline"] as const;
const AVATAR_SHAPES = ["circle", "rounded"] as const;
const LAYOUT_DENSITIES = ["default", "compact", "spacious"] as const;

const STATUS_DOT_STYLES: Record<string, { bg: string; label: string }> = {
  online: { bg: "bg-[#22c55e]", label: "Online" },
  idle: { bg: "bg-[#faa61a]", label: "Idle" },
  busy: { bg: "bg-[#f04747]", label: "Busy" },
  offline: { bg: "bg-[#747f8d]", label: "Offline" },
};

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
  const useTerminalLayout = Boolean(profile.useTerminalLayout && (profile.terminalCommands?.length || profile.terminalTitle != null));

  return (
    <div className={`relative z-10 w-full max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-auto ${themeClass}`}>
      <div className="mb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2 text-sm text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:shadow-[0_0_12px_rgba(6,182,212,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
        >
          <span className="text-[var(--terminal)]">{prompt}</span> cd ..
        </Link>
      </div>
      <article
        className={`rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden transition-shadow duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(6,182,212,0.05)] ${cardClass} ${densityClass}`}
        aria-labelledby="profile-name"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/90 px-3 py-2.5 sm:px-4">
          <div className="flex gap-1.5 items-center shrink-0" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308] shadow-[0_0_6px_rgba(234,179,8,0.4)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
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
            <pre
              className={`leading-tight whitespace-pre font-mono mt-1.5 mb-4 overflow-x-auto overflow-y-hidden rounded-lg py-2 px-1 ${bannerClass}`}
              style={{
                fontSize: profile.bannerSmall ? "clamp(2px, 0.5vh, 5px)" : "clamp(5px, 1.1vh, 10px)",
                lineHeight: 1.12,
                maxHeight: "min(260px, 32vh)",
              }}
              aria-hidden
            >
              {profile.banner}
            </pre>
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
                <img
                  src={profile.avatar}
                  alt=""
                  width={64}
                  height={64}
                  className={`profile-avatar h-16 w-16 shrink-0 border-2 border-[var(--border)] object-cover ring-2 ring-[var(--surface)] shadow-lg transition-all duration-200 hover:ring-[var(--accent)]/30 hover:border-[var(--accent)]/40 ${avatarClass}`}
                />
              )
            )}
            <div className="profile-name-block min-w-0 flex-1">
              <h1 id="profile-name" className="text-xl font-semibold text-[var(--foreground)] tracking-tight flex items-center gap-2 flex-wrap">
                {profile.displayStatus && DISPLAY_STATUSES.includes(profile.displayStatus as (typeof DISPLAY_STATUSES)[number]) && (
                  <span
                    className={`shrink-0 inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT_STYLES[profile.displayStatus]?.bg ?? "bg-[#747f8d]"} ring-2 ring-[var(--surface)]`}
                    title={STATUS_DOT_STYLES[profile.displayStatus]?.label ?? "Status"}
                    aria-hidden
                  />
                )}
                {profile.nameGreeting?.trim() && (
                  <span className="text-[var(--muted)] font-normal">{profile.nameGreeting.trim()} </span>
                )}
                {profile.name}
                {(profile.verified || profile.staff || (profile.discordBadges?.length ?? 0) > 0) && (
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
                <p className="text-xs text-[var(--muted)] mt-0.5">📍 {profile.location.trim()}</p>
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
                    <p className="text-xs text-[var(--muted)] mt-0.5" title={`Current time in ${profile.timezone}`}>
                      🕐 {localTime}
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
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    🎂 {countdown}
                  </p>
                );
              })()}
            </div>
          </div>
          {profile.description && (
            <ProfileDescription text={profile.description} />
          )}
          {profile.tags && profile.tags.length > 0 && (
            <ProfileTags tags={profile.tags} />
          )}
          {profile.status && <ProfileStatus status={profile.status} />}
          {profile.quote && <ProfileQuote quote={profile.quote} />}
          <ProfileLinks
            discord={profile.discord}
            roblox={profile.roblox}
            links={profile.links}
          />
          {profile.gallery && profile.gallery.length > 0 && (
            <section className="mt-6" aria-labelledby="gallery-heading">
              <h2 id="gallery-heading" className="text-sm font-medium text-[var(--muted)] mb-3">
                Gallery
              </h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 list-none p-0 m-0">
                {profile.gallery.map((item) => (
                  <li key={item.id} className="rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--bg)]/50">
                    <a
                      href={item.imageUrl.startsWith("/") ? item.imageUrl : item.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] rounded-lg"
                    >
                      {item.imageUrl.includes("cdn.discordapp.com") ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title ?? ""}
                          width={240}
                          height={240}
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <img
                          src={item.imageUrl.startsWith("/") ? item.imageUrl : item.imageUrl}
                          alt={item.title ?? ""}
                          width={240}
                          height={240}
                          className="w-full aspect-square object-cover"
                        />
                      )}
                    </a>
                    {(item.title || item.description) && (
                      <div className="p-2">
                        {item.title && (
                          <p className="font-medium text-[var(--foreground)] text-sm truncate" title={item.title}>
                            {item.title}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-[var(--muted)] line-clamp-2" title={item.description}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
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
          {profile.updatedAt && (
            <p className="mt-4 pt-3 border-t border-[var(--border)]/50 text-xs text-[var(--muted)]">
              Last updated {profile.updatedAt}
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
  );
}
