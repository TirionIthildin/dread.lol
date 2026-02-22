"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ClipboardText,
  DiscordLogo,
  FileText,
  ImagesSquare,
  SignOut,
  Storefront,
  Trophy,
  User,
} from "@phosphor-icons/react";
import DashboardNavAdmin from "@/app/dashboard/DashboardNavAdmin";
import type { SessionUser } from "@/lib/auth/session";

const ERROR_LABELS: Record<string, string> = {
  oauth_config: "OAuth is not configured.",
  discord: "Discord denied the login.",
  callback_missing: "Missing code or state from Discord.",
  invalid_state: "Login link expired. Ensure Valkey/Redis is running.",
  token_exchange: "Failed to exchange tokens. Try again.",
};

const mainNavItems = [
  {
    href: "/dashboard",
    label: "My profile",
    icon: <User size={20} weight="regular" className="shrink-0" aria-hidden />,
  },
  {
    href: "/dashboard/marketplace",
    label: "Marketplace",
    icon: <Storefront size={20} weight="regular" className="shrink-0" aria-hidden />,
  },
] as const;

const contentNavItems = [
  {
    href: "/dashboard/gallery",
    label: "Gallery",
    icon: <ImagesSquare size={20} weight="regular" className="shrink-0" aria-hidden />,
  },
  {
    href: "/dashboard/paste",
    label: "Paste",
    icon: <ClipboardText size={20} weight="regular" className="shrink-0" aria-hidden />,
  },
] as const;

const discoverNavItems = [
  {
    href: "/dashboard/leaderboard",
    label: "Leaderboard",
    icon: <Trophy size={20} weight="regular" className="shrink-0" aria-hidden />,
  },
  {
    href: "/dashboard/views",
    label: "Logs",
    icon: <FileText size={20} weight="regular" className="shrink-0" aria-hidden />,
  },
] as const;

type Props = { isAdmin: boolean; session: SessionUser | null };

export default function DashboardSidebar({ isAdmin, session }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const errorText = message ?? (error ? ERROR_LABELS[error] ?? error : null);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const navLinkClass = (active: boolean) =>
    `group relative inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
      active
        ? "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25 md:border-l-[3px] md:border-l-[var(--accent)] shadow-[0_0_16px_-10px_var(--accent)]"
        : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]/80 border border-transparent hover:border-[var(--border-bright)]/50"
    }`;

  const NavSection = ({
    items,
    sectionLabel,
    itemOffset = 0,
  }: {
    items: typeof mainNavItems | typeof discoverNavItems | typeof contentNavItems;
    sectionLabel?: string;
    itemOffset?: number;
  }) => (
    <div className="flex flex-row md:flex-col md:gap-0.5 gap-1 flex-shrink-0 md:flex-shrink">
      {sectionLabel && (
        <p className="hidden md:block px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]/70">
          {sectionLabel}
        </p>
      )}
      {items.map((item, i) => {
        const active = isActive(item.href);
        const delay = 20 + (itemOffset + i) * 25;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item block ${navLinkClass(active)}`}
            style={{ animationDelay: `${delay}ms` } as React.CSSProperties}
          >
            <span
              className={`flex shrink-0 items-center justify-center transition-colors ${
                active ? "text-[var(--accent)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
              }`}
            >
              {item.icon}
            </span>
            <span className="flex-1 min-w-0 truncate">{item.label}</span>
            {active && (
              <span
                className="hidden md:inline-block size-1.5 rounded-full bg-[var(--accent)] animate-pulse"
                aria-hidden
              />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside
      className="shrink-0 w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r-0 font-mono flex flex-col min-h-0"
      aria-label="Dashboard navigation"
    >
      <nav className="flex md:flex-col gap-1 p-2 md:p-3 overflow-x-auto md:overflow-x-visible overflow-y-auto flex-1 min-h-0">
        {/* Main nav */}
        <NavSection items={mainNavItems} sectionLabel="Nav" itemOffset={0} />
        {/* Content: Gallery & Paste */}
        <NavSection
          items={contentNavItems}
          sectionLabel="Content"
          itemOffset={mainNavItems.length}
        />
        {/* Discover */}
        <NavSection
          items={discoverNavItems}
          sectionLabel="Discover"
          itemOffset={mainNavItems.length + contentNavItems.length}
        />
        {/* Admin */}
        {isAdmin && (
          <div className="md:mt-3 md:pt-3 md:border-t border-[var(--border)] space-y-0.5">
            <p className="hidden md:block px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--warning)]/80">
              Admin
            </p>
            <div
              className="sidebar-item"
              style={{ animationDelay: `${20 + (mainNavItems.length + contentNavItems.length + discoverNavItems.length) * 25}ms` } as React.CSSProperties}
            >
              <DashboardNavAdmin isAdmin={isAdmin} variant="sidebar" />
            </div>
          </div>
        )}
      </nav>

      {/* User / Auth footer */}
      <div className="p-3 shrink-0 border-t border-[var(--border)] mt-auto">
        {session ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)]/80 bg-[var(--bg)]/60 px-3 py-2.5 backdrop-blur-sm">
              {session.picture && (
                <Image
                  src={session.picture}
                  alt=""
                  className="h-10 w-10 rounded-lg border border-[var(--border)] shrink-0 object-cover ring-1 ring-[var(--border)]/50"
                  width={40}
                  height={40}
                  unoptimized
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {session.name ?? session.preferred_username ?? "User"}
                </p>
                <p className="text-[10px] text-[var(--muted)] truncate">
                  <span className="text-[var(--terminal)]">~</span>{" "}
                  {session.preferred_username ?? "member"}
                </p>
              </div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-xs font-medium text-[var(--muted)] transition-all duration-200 hover:border-[var(--warning)]/60 hover:text-[var(--warning)] hover:bg-[var(--warning)]/8 active:scale-[0.98]"
              >
                <SignOut size={14} weight="regular" />
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            {errorText && (
              <p
                className="rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30 px-3 py-2 text-xs text-[var(--warning)]"
                role="alert"
              >
                {errorText}
              </p>
            )}
            <Link
              href="/api/auth/discord"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#5865F2]/60 bg-[#5865F2]/15 px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[#5865F2]/25 hover:border-[#5865F2]/80 hover:shadow-[0_0_20px_-6px_#5865F2] active:scale-[0.98]"
            >
              <DiscordLogo size={20} weight="fill" className="shrink-0 text-[#5865F2]" />
              Log in with Discord
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
