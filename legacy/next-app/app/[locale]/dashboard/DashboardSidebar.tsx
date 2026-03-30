"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type CSSProperties } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  Pen,
  type LucideIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { DashboardNavDrawer } from "@/app/[locale]/dashboard/components/DashboardNavDrawer";
import {
  mainNavItems,
  contentNavItems,
  discoverNavItems,
  getDashboardPageTitle,
} from "@/app/[locale]/dashboard/dashboardNavConfig";

const ERROR_LABELS: Record<string, string> = {
  oauth_config: "OAuth is not configured.",
  discord: "Discord denied the login.",
  callback_missing: "Missing code or state from Discord.",
  invalid_state: "Login link expired. Ensure Valkey/Redis is running.",
  token_exchange: "Failed to exchange tokens. Try again.",
};

type NavLinkItem = { href: string; label: string; icon: LucideIcon };

type Props = { isAdmin: boolean; verifiedCreator: boolean; session: SessionUser | null };

export default function DashboardSidebar({ isAdmin, verifiedCreator, session }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const errorText = message ?? (error ? ERROR_LABELS[error] ?? error : null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const pageTitle = getDashboardPageTitle(pathname, { isAdmin, verifiedCreator });

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const mainNavCount = verifiedCreator ? mainNavItems.length + 1 : mainNavItems.length;

  const NavLink = ({
    item,
    active,
    delay,
    onNavigate,
  }: {
    item: NavLinkItem;
    active: boolean;
    delay: number;
    onNavigate?: () => void;
  }) => {
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`sidebar-item group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 md:border-l-2 md:border-l-transparent md:pl-[calc(0.75rem+2px)] ${
          active
            ? "bg-[var(--accent)]/10 text-[var(--accent)] md:border-l-[var(--accent)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-hover)]/90 hover:text-[var(--foreground)] md:hover:border-l-[var(--border-bright)]/60"
        }`}
        style={{ animationDelay: `${delay}ms` } as CSSProperties}
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
            active
              ? "bg-[var(--accent)]/20 text-[var(--accent)]"
              : "bg-[var(--surface)]/80 text-[var(--muted)] group-hover:bg-[var(--surface-hover)] group-hover:text-[var(--foreground)]"
          }`}
        >
          <Icon size={18} className="shrink-0" aria-hidden />
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
    onNavigate,
  }: {
    items: readonly NavLinkItem[];
    sectionLabel?: string;
    itemOffset?: number;
    onNavigate?: () => void;
  }) => (
    <div className="flex flex-col gap-1 flex-shrink-0">
      {sectionLabel && (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border)]" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]/60">
            {sectionLabel}
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border)]" />
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map((item, i) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            delay={20 + (itemOffset + i) * 25}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );

  const mainItems: NavLinkItem[] = verifiedCreator
    ? [...mainNavItems, { href: "/dashboard/creator", label: "Creator", icon: Pen }]
    : [...mainNavItems];

  const closeMenu = () => setMenuOpen(false);

  const navBody = (onNavigate?: () => void) => (
    <>
      <NavSection items={mainItems} sectionLabel="Main" itemOffset={0} onNavigate={onNavigate} />
      <NavSection
        items={[...contentNavItems]}
        sectionLabel="Content"
        itemOffset={mainNavCount}
        onNavigate={onNavigate}
      />
      <NavSection
        items={[...discoverNavItems]}
        sectionLabel="Discover"
        itemOffset={mainNavCount + contentNavItems.length}
        onNavigate={onNavigate}
      />
      {isAdmin && (
        <div className="mt-4 border-t border-[var(--border)]/60 pt-4">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--warning)]/40 to-[var(--border)]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--warning)]/70">
              Staff
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--warning)]/40 to-[var(--border)]" />
          </div>
          <NavLink
            item={{
              href: "/dashboard/staff",
              label: "Staff",
              icon: Settings,
            }}
            active={pathname.startsWith("/dashboard/staff")}
            delay={20 + (mainNavCount + contentNavItems.length + discoverNavItems.length) * 25}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)]/60 px-3 py-2.5 md:hidden">
        <p className="min-w-0 truncate text-sm font-semibold text-[var(--foreground)]">{pageTitle}</p>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
          aria-expanded={menuOpen}
          aria-controls="dashboard-mobile-nav"
        >
          <Menu size={18} aria-hidden />
          Menu
        </button>
      </div>

      <DashboardNavDrawer
        open={menuOpen}
        onClose={closeMenu}
        title="Dashboard"
        returnFocusRef={menuButtonRef}
      >
        <nav id="dashboard-mobile-nav" className="flex flex-col gap-4 px-3 py-4" aria-label="Dashboard navigation">
          {navBody(closeMenu)}
        </nav>
      </DashboardNavDrawer>

      {/* Desktop navigation */}
      <nav
        className="hidden min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-2 py-4 md:flex md:px-3 md:py-5"
        aria-label="Dashboard navigation"
      >
        {navBody()}
      </nav>

      {/* User / Auth footer */}
      <div className="shrink-0 border-t border-[var(--border)]/60 bg-[var(--bg)]/30 p-3 pt-4 md:bg-gradient-to-t md:from-[var(--bg)]/50 md:to-transparent md:pt-5">
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
                <p className="truncate text-sm font-semibold leading-tight text-[var(--foreground)]">
                  {session.name ?? session.preferred_username ?? "User"}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                  <span className="text-[var(--terminal)]/90">~</span>{" "}
                  {session.preferred_username ?? "member"}
                </p>
              </div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/50 px-3 py-2 text-xs font-medium text-[var(--muted)] transition-all duration-200 hover:border-[var(--border-bright)]/70 hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] active:scale-[0.99]"
              >
                <LogOut size={16} />
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            {errorText && (
              <p
                className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3 py-2.5 text-xs text-[var(--warning)]"
                role="alert"
              >
                {errorText}
              </p>
            )}
            <Link
              href="/api/auth/discord"
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-[#5865F2]/50 bg-[#5865F2]/10 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:border-[#5865F2]/70 hover:bg-[#5865F2]/20 hover:shadow-[0_0_24px_-8px_#5865F2] active:scale-[0.99]"
            >
              <MessageCircle size={22} className="shrink-0 fill-[#5865F2] text-[#5865F2]" />
              Log in with Discord
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
