import Link from "next/link";
import Image from "next/image";
import { DiscordLogo, SignOut } from "@phosphor-icons/react/dist/ssr";
import { getSession } from "@/lib/auth/session";
import { getProfileSlugByUserId } from "@/lib/member-profiles";
import LocalAuthForms from "@/app/components/LocalAuthForms";

export default async function SignInWidget() {
  const session = await getSession();

  return (
    <div className="shrink-0 w-full sm:w-auto sm:min-w-[180px]">
      {session ? (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {session.picture && (
                <Image
                  src={session.picture}
                  alt=""
                  className="h-10 w-10 rounded-full border border-[var(--border)] shrink-0"
                  width={40}
                  height={40}
                  unoptimized
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                  {session.name ?? session.preferred_username ?? "Member"}
                </p>
                <UserLinks userId={session.sub} />
              </div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--warning)]/50 hover:text-[var(--warning)] hover:bg-[var(--warning)]/5 transition-colors"
              >
                <SignOut size={18} weight="regular" className="shrink-0" aria-hidden />
                Sign out
              </button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
            <p className="text-xs text-[var(--muted)]">
              Sign in to manage your profile
            </p>
            <Link
              href="/api/auth/discord"
              className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-[#5865F2]/50 bg-[#5865F2]/10 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[#5865F2]/20 transition-colors"
            >
              <DiscordLogo size={20} weight="fill" className="shrink-0 text-[#5865F2]" aria-hidden />
              Sign in with Discord
          </Link>
          <LocalAuthForms />
        </div>
      )}
    </div>
  );
}

async function UserLinks({ userId }: { userId: string }) {
  const slug = await getProfileSlugByUserId(userId);

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
      {slug && (
        <Link
          href={`/${slug}`}
          className="text-[var(--accent)] hover:underline"
        >
          Profile
        </Link>
      )}
      <Link
        href="/dashboard"
        className="text-[var(--accent)] hover:underline"
      >
        Dashboard
      </Link>
    </div>
  );
}
