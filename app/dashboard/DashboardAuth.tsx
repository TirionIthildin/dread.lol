"use client";

import type { SessionUser } from "@/lib/auth/session";

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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-3">
          {user.picture && (
            <img
              src={user.picture}
              alt=""
              className="h-9 w-9 rounded-full border border-[var(--border)]"
              width={36}
              height={36}
            />
          )}
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {user.name ?? user.preferred_username ?? `Discord user ${user.sub}`}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Discord ID: {user.sub}
              {user.profile && (
                <>
                  {" · "}
                  <a
                    href={user.profile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline"
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
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--warning)]/50 hover:text-[var(--warning)] focus:outline-none focus:ring-2 focus:ring-[var(--warning)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
          >
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
          className="rounded-lg border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-2 text-sm text-[var(--warning)]"
          role="alert"
        >
          {errorText}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="text-sm text-[var(--muted)]">
          Sign in with your Discord account to manage the dashboard.
        </p>
        <a
          href="/api/auth/discord"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
        >
          Log in with Discord
        </a>
      </div>
    </div>
  );
}
