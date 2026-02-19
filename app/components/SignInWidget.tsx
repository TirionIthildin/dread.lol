import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth/session";
import { getProfileSlugByUserId } from "@/lib/member-profiles";

const DiscordIcon = () => (
  <svg className="shrink-0 w-[18px] h-[18px]" viewBox="0 0 256 199" fill="currentColor" aria-hidden>
    <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.094 43.653 24.346 64.775 24.346 5.17-6.765 9.588-14.045 13.154-21.856-7.154-2.126-14.045-4.933-20.5-8.446 1.718-1.221 3.4-2.55 5.017-3.933 49.526 22.694 103.275 22.694 152.5 0 1.618 1.382 3.3 2.712 5.018 3.933-6.455 3.513-13.346 6.32-20.5 8.446 3.565 7.811 7.984 15.091 13.154 21.856 21.122 0 42.606-8.252 64.776-24.346 5.316-56.288-9.08-105.09-38.056-148.359ZM85.474 135.095c-12.645 0-23.015-11.745-23.015-26.18s10.142-26.2 23.015-26.2c12.867 0 23.236 11.763 23.015 26.2 0 14.435-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.745-23.014-26.18s10.143-26.2 23.014-26.2c12.868 0 23.016 11.763 23.015 26.2 0 14.435-10.147 26.18-23.015 26.18Z" />
  </svg>
);

const SignOutIcon = () => (
  <svg className="shrink-0 w-[14px] h-[14px]" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M174 224H88a56 56 0 0 1 0-112h86" />
    <path d="m136 112 40-40 40 40" />
  </svg>
);

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
                <SignOutIcon />
                Sign out
              </button>
          </form>
        </div>
      ) : (
        <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">
              Sign in to manage your profile
            </p>
            <Link
              href="/api/auth/discord"
              className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-[#5865F2]/50 bg-[#5865F2]/10 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[#5865F2]/20 transition-colors"
            >
              <span className="text-[#5865F2]"><DiscordIcon /></span>
              Sign in with Discord
          </Link>
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
