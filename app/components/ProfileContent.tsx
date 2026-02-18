import Link from "next/link";
import Image from "next/image";
import type { Profile } from "@/lib/profiles";
import ProfileLinks from "@/app/components/ProfileLinks";
import ProfileDescription from "@/app/components/ProfileDescription";
import ProfileTags from "@/app/components/ProfileTags";
import ProfileStatus from "@/app/components/ProfileStatus";
import ProfileQuote from "@/app/components/ProfileQuote";
import TaglineWithEasterEgg from "@/app/components/TaglineWithEasterEgg";

interface ProfileContentProps {
  profile: Profile;
}

export default function ProfileContent({ profile }: ProfileContentProps) {
  return (
    <div className="relative z-10 w-full max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-auto">
      <div className="mb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2 text-sm text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:shadow-[0_0_12px_rgba(6,182,212,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
        >
          <span className="text-[var(--terminal)]">$</span> cd ..
        </Link>
      </div>
      <article
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden transition-shadow duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(6,182,212,0.05)]"
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
        <div className="p-3 font-mono text-sm sm:p-4 sm:text-sm border-t border-[var(--border)]/50">
          <p className="text-[var(--terminal)]">
            <span className="text-[var(--muted)]">$</span> cat {profile.slug}.txt
          </p>
          {profile.banner && (
            <pre
              className={`leading-tight whitespace-pre font-mono mt-1.5 mb-4 overflow-x-auto overflow-y-hidden rounded-lg py-2 px-1 ${
                profile.bannerAnimatedFire ? "banner-fire-gradient" : "text-[var(--accent)]"
              }`}
              style={{
                fontSize: profile.bannerSmall ? "clamp(2px, 0.5vh, 5px)" : "clamp(5px, 1.1vh, 10px)",
                lineHeight: 1.12,
                maxHeight: "min(260px, 32vh)",
                ...(!profile.bannerAnimatedFire && { textShadow: "0 0 20px rgba(6, 182, 212, 0.15)" }),
              }}
              aria-hidden
            >
              {profile.banner}
            </pre>
          )}
          <div className="mt-4 flex items-center gap-4">
            {profile.avatar && (
              <Image
                src={profile.avatar}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-full border-2 border-[var(--border)] object-cover ring-2 ring-[var(--surface)] shadow-lg transition-all duration-200 hover:ring-[var(--accent)]/30 hover:border-[var(--accent)]/40"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 id="profile-name" className="text-xl font-semibold text-[var(--foreground)] tracking-tight">{profile.name}</h1>
              {profile.tagline && (
                <TaglineWithEasterEgg
                  tagline={profile.tagline}
                  triggerWord={profile.easterEggLink?.triggerWord ?? profile.easterEggTaglineWord}
                  linkUrl={profile.easterEggLink?.url}
                  popupUrl={profile.easterEggLink?.popupUrl}
                />
              )}
            </div>
          </div>
          {(profile.description || profile.easterEgg) && (
            <ProfileDescription
              text={profile.description}
              easterEgg={profile.easterEgg}
            />
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
          {profile.updatedAt && (
            <p className="mt-4 pt-3 border-t border-[var(--border)]/50 text-xs text-[var(--muted)]">
              Last updated {profile.updatedAt}
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
