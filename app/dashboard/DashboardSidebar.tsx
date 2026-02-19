"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { DiscordLogo, ImagesSquare, SignOut } from "@phosphor-icons/react";
import DashboardNavAdmin from "@/app/dashboard/DashboardNavAdmin";
import type { SessionUser } from "@/lib/auth/session";

const ERROR_LABELS: Record<string, string> = {
  oauth_config: "OAuth is not configured.",
  discord: "Discord denied the login.",
  callback_missing: "Missing code or state from Discord.",
  invalid_state: "Login link expired. Ensure Valkey/Redis is running.",
  token_exchange: "Failed to exchange tokens. Try again.",
};

const navItems = [
  {
    href: "/dashboard",
    label: "My profile",
    icon: (
      <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/gallery",
    label: "Gallery",
    icon: <ImagesSquare size={20} weight="regular" className="shrink-0" aria-hidden />,
  },
  {
    href: "/dashboard/views",
    label: "Logs",
    icon: (
      <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
  },
] as const;

type Props = { isAdmin: boolean; session: SessionUser | null };

export default function DashboardSidebar({ isAdmin, session }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const errorText = message ?? (error ? ERROR_LABELS[error] ?? error : null);

  return (
    <aside
      className="shrink-0 w-full md:w-56 lg:w-60 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface)]/95 font-mono flex flex-col min-h-0"
      aria-label="Dashboard navigation"
    >
      <nav className="flex md:flex-col gap-0.5 p-2 md:p-3 overflow-x-auto md:overflow-x-visible overflow-y-auto flex-1 min-h-0">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                  : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <div className="md:mt-2 md:pt-2 md:border-t border-[var(--border)]">
            <DashboardNavAdmin isAdmin={isAdmin} variant="sidebar" />
          </div>
        )}
      </nav>
      <div className="p-2 md:p-3 shrink-0 border-t border-[var(--border)] mt-auto">
        {session ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {session.picture && (
                <Image
                  src={session.picture}
                  alt=""
                  className="h-9 w-9 rounded-full border border-[var(--border)] shrink-0"
                  width={36}
                  height={36}
                  unoptimized
                />
              )}
              <p className="text-sm font-medium text-[var(--foreground)] truncate min-w-0 flex-1">
                {session.name ?? session.preferred_username ?? "User"}
              </p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--warning)]/50 hover:text-[var(--warning)] hover:bg-[var(--warning)]/5 transition-colors"
              >
                <SignOut size={14} weight="regular" />
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-2">
            {errorText && (
              <p className="text-xs text-[var(--warning)]" role="alert">
                {errorText}
              </p>
            )}
            <Link
              href="/api/auth/discord"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#5865F2]/50 bg-[#5865F2]/10 px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[#5865F2]/20 transition-colors"
            >
              <DiscordLogo size={18} weight="fill" className="shrink-0 text-[#5865F2]" />
              Log in with Discord
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
