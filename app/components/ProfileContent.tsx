import Link from "next/link";
import type { Profile } from "@/lib/profiles";
import ProfileLinks from "@/app/components/ProfileLinks";
import ProfileDescription from "@/app/components/ProfileDescription";
import TaglineWithEasterEgg from "@/app/components/TaglineWithEasterEgg";

interface ProfileContentProps {
  profile: Profile;
}

export default function ProfileContent({ profile }: ProfileContentProps) {
  return (
    <div className="relative z-10 w-full max-w-2xl">
      <p className="text-[var(--terminal)] text-sm mb-6">
        <span className="text-[var(--muted)]">$</span>{" "}
        <Link
          href="/"
          className="text-[var(--accent)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] rounded"
        >
          cd ..
        </Link>
      </p>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 sm:px-4">
          <div className="flex gap-1.5 items-center shrink-0" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            <span className="h-2 w-2 rounded-full bg-[#eab308]" />
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
          </div>
          <span className="ml-2 font-mono text-xs text-[var(--muted)] truncate flex-1 min-w-0">
            {profile.slug}.txt
          </span>
        </div>
        <div className="p-4 font-mono text-sm sm:p-5 sm:text-sm border-t border-[var(--border)]/50">
          <p className="text-[var(--terminal)]">
            <span className="text-[var(--muted)]">$</span> cat {profile.slug}.txt
          </p>
          {profile.banner && (
            <pre className="text-[10px] sm:text-xs leading-tight text-[var(--accent)] whitespace-pre font-mono mt-2 mb-4 overflow-x-auto" aria-hidden>
              {profile.banner}
            </pre>
          )}
          <div className="mt-4 flex items-center gap-4">
            {profile.avatar && (
              <img
                src={profile.avatar}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-full border-2 border-[var(--border)] object-cover"
              />
            )}
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">{profile.name}</h1>
              {profile.tagline && (
                <TaglineWithEasterEgg
                  tagline={profile.tagline}
                  triggerWord={profile.easterEggTaglineWord}
                />
              )}
            </div>
          </div>
          <ProfileDescription
            text={profile.description}
            easterEgg={profile.easterEgg}
          />
          <ProfileLinks discord={profile.discord} roblox={profile.roblox} />
        </div>
      </div>
    </div>
  );
}
