"use client";

import Link from "next/link";
import Image from "next/image";
import { DiscordLogo, SignOut } from "@phosphor-icons/react";
import type { SessionUser } from "@/lib/auth/session";

const iconSize = 20;

interface DashboardAuthProps {
  user: SessionUser | null;
  error?: string | null;
  message?: string | null;
}

const ERROR_LABELS: Record<string, string> = {
  oauth_config: "OAuth is not configured. Set DISCORD_OAUTH_* and AUTH_* in .env.",
  discord: "Discord denied the login.",
  callback_missing: "Missing code or state from Discord.",
  invalid_state: "Login link expired or session store unavailable. Ensure Valkey (or Redis) is running (e.g. docker compose up -d), then try again.",
  token_exchange: "Failed to exchange code for tokens. Try again.",
};

export default function DashboardAuth({ user, error, message }: DashboardAuthProps) {
  const errorText = message ?? (error ? ERROR_LABELS[error] ?? error : null);

  if (user) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-center gap-3">
          {user.picture && (
            <Image
              src={user.picture}
              alt=""
              className="h-10 w-10 rounded-full border-2 border-[var(--border)] ring-2 ring-[var(--accent)]/20 transition-transform duration-200 hover:scale-105"
              width={40}
              height={40}
              unoptimized
            />
          )}
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {user.name ?? user.preferred_username ?? `Discord user ${user.sub}`}
            </p>
            <p className="text-xs text-[var(--muted)] flex items-center gap-1 flex-wrap">
              <DiscordLogo size={14} weight="fill" className="shrink-0 text-[#5865F2]" />
              {user.sub}
              {user.profile && (
                <>
                  {" · "}
                  <a
                    href={user.profile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline transition-colors"
                  >
                    Profile
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition-all duration-200 hover:border-[var(--warning)]/50 hover:text-[var(--warning)] hover:bg-[var(--warning)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--warning)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
          >
            <SignOut size={16} weight="regular" />
            Log out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errorText && (
        <div
          className="rounded-lg border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-2 text-sm text-[var(--warning)] animate-fade-in"
          role="alert"
        >
          {errorText}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-sm">
        <p className="text-sm text-[var(--muted)]">
          Sign in with your Discord account to manage the dashboard.
        </p>
        <Link
          href="/api/auth/discord"
          className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[#5865F2]/10 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
        >
          <DiscordLogo size={iconSize} weight="fill" className="shrink-0 text-[#5865F2]" />
          Log in with Discord
        </Link>
      </div>
    </div>
  );
}
