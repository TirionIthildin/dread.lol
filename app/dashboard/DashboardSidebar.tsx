"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Article,
  ChartLine,
  ClipboardText,
  CreditCard,
  DiscordLogo,
  GearSix,
  ImagesSquare,
  LinkSimple,
  Medal,
  SignOut,
  Storefront,
  Trophy,
  User,
} from "@phosphor-icons/react";
import type { SessionUser } from "@/lib/auth/session";

const ERROR_LABELS: Record<string, string> = {
  oauth_config: "OAuth is not configured.",
  discord: "Discord denied the login.",
  callback_missing: "Missing code or state from Discord.",
  invalid_state: "Login link expired. Ensure Valkey/Redis is running.",
  token_exchange: "Failed to exchange tokens. Try again.",
};

const mainNavItems = [
  { href: "/dashboard", label: "My profile", icon: User },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: Storefront },
  { href: "/dashboard/premium", label: "Premium", icon: CreditCard },
  { href: "/dashboard/badges", label: "Badges", icon: Medal },
] as const;

const contentNavItems = [
  { href: "/dashboard/blog", label: "Blog", icon: Article },
  { href: "/dashboard/gallery", label: "Gallery", icon: ImagesSquare },
  { href: "/dashboard/paste", label: "Paste", icon: ClipboardText },
  { href: "/dashboard/short", label: "Short links", icon: LinkSimple },
] as const;

const discoverNavItems = [
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/views", label: "Analytics", icon: ChartLine },
] as const;

type NavItem = (typeof mainNavItems)[number];

type Props = { isAdmin: boolean; session: SessionUser | null };

export default function DashboardSidebar({ isAdmin, session }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const errorText = message ?? (error ? ERROR_LABELS[error] ?? error : null);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const NavLink = ({
    item,
    active,
    delay,
  }: {
    item: NavItem | { href: string; label: string; icon: typeof GearSix };
    active: boolean;
    delay: number;
  }) => {
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={`sidebar-item group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 md:border-l-2 md:border-l-transparent md:pl-[calc(0.75rem+2px)] ${
          active
            ? "bg-[var(--accent)]/10 text-[var(--accent)] md:border-l-[var(--accent)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-hover)]/90 hover:text-[var(--foreground)] md:hover:border-l-[var(--border-bright)]/60"
        }`}
        style={{ animationDelay: `${delay}ms` } as React.CSSProperties}
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
            active
              ? "bg-[var(--accent)]/20 text-[var(--accent)]"
              : "bg-[var(--surface)]/80 text-[var(--muted)] group-hover:bg-[var(--surface-hover)] group-hover:text-[var(--foreground)]"
          }`}
        >
          <Icon size={18} weight="regular" className="shrink-0" aria-hidden />
        </span>
        <span className="flex-1 min-w-0 truncate">{item.label}</span>
        {active && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block size-1.5 rounded-full bg-[var(--accent)]"
            aria-hidden
          />
        )}
      </Link>
    );
  };

  const NavSection = ({
    items,
    sectionLabel,
    itemOffset = 0,
  }: {
    items: (typeof mainNavItems | typeof discoverNavItems | typeof contentNavItems);
    sectionLabel?: string;
    itemOffset?: number;
  }) => (
    <div className="flex flex-row md:flex-col gap-1 flex-shrink-0 md:flex-shrink">
      {sectionLabel && (
        <div className="hidden md:flex items-center gap-2 px-3 py-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border)]" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]/60">
            {sectionLabel}
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border)]" />
        </div>
      )}
      <div className="flex flex-row md:flex-col md:gap-0.5 gap-1">
        {items.map((item, i) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            delay={20 + (itemOffset + i) * 25}
          />
        ))}
      </div>
    </div>
  );

  return (
    <aside
      className="flex flex-1 flex-col min-h-0 w-full"
      aria-label="Dashboard navigation"
    >
      <nav className="flex flex-1 flex-col gap-4 overflow-x-auto overflow-y-auto px-2 py-4 md:px-3 md:gap-6 md:py-5 min-h-0">
        <NavSection items={mainNavItems} sectionLabel="Main" itemOffset={0} />
        <NavSection
          items={contentNavItems}
          sectionLabel="Content"
          itemOffset={mainNavItems.length}
        />
        <NavSection
          items={discoverNavItems}
          sectionLabel="Discover"
          itemOffset={mainNavItems.length + contentNavItems.length}
        />
        {isAdmin && (
          <div className="mt-auto pt-4 md:pt-6 border-t border-[var(--border)]/60">
            <div className="hidden md:flex items-center gap-2 px-3 py-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--warning)]/40 to-[var(--border)]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--warning)]/70">
                Admin
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--warning)]/40 to-[var(--border)]" />
            </div>
            <NavLink
              item={{
                href: "/dashboard/admin",
                label: "Admin",
                icon: GearSix,
              }}
              active={pathname.startsWith("/dashboard/admin")}
              delay={20 + (mainNavItems.length + contentNavItems.length + discoverNavItems.length) * 25}
            />
          </div>
        )}
      </nav>

      {/* User / Auth footer */}
      <div className="shrink-0 p-3 pt-4 md:pt-5 border-t border-[var(--border)]/60 bg-[var(--bg)]/30 md:bg-gradient-to-t from-[var(--bg)]/50 to-transparent">
        {session ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/60 px-3.5 py-2.5 shadow-sm backdrop-blur-md">
              {session.picture && (
                <div className="relative shrink-0">
                  <Image
                    src={session.picture}
                    alt=""
                    className="h-11 w-11 rounded-xl object-cover ring-1 ring-[var(--border)]/50"
                    width={44}
                    height={44}
                    unoptimized
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--surface)] bg-[var(--terminal)]"
                    aria-hidden
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate leading-tight">
                  {session.name ?? session.preferred_username ?? "User"}
                </p>
                <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                  <span className="text-[var(--terminal)]/90">~</span>{" "}
                  {session.preferred_username ?? "member"}
                </p>
              </div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/50 px-3 py-2 text-xs font-medium text-[var(--muted)] transition-all duration-200 hover:border-[var(--border-bright)]/70 hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] active:scale-[0.99]"
              >
                <SignOut size={16} weight="regular" />
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            {errorText && (
              <p
                className="rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/30 px-3 py-2.5 text-xs text-[var(--warning)]"
                role="alert"
              >
                {errorText}
              </p>
            )}
            <Link
              href="/api/auth/discord"
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-[#5865F2]/50 bg-[#5865F2]/10 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/70 hover:shadow-[0_0_24px_-8px_#5865F2] active:scale-[0.99]"
            >
              <DiscordLogo size={22} weight="fill" className="shrink-0 text-[#5865F2]" />
              Log in with Discord
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
