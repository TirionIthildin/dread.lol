import type { LucideIcon } from "lucide-react";
import {
  Newspaper,
  ChartLine,
  Clipboard,
  CreditCard,
  Images,
  Link2,
  Waypoints,
  Medal,
  Pen,
  Pencil,
  Shield,
  Settings,
  Store,
  Trophy,
  User,
} from "lucide-react";

export const mainNavItems = [
  { href: "/dashboard", label: "My profile", icon: User },
  { href: "/dashboard/profile-editor", label: "Profile editor", icon: Pencil },
  { href: "/dashboard/security", label: "Security", icon: Shield },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: Store },
  { href: "/dashboard/premium", label: "Premium", icon: CreditCard },
  { href: "/dashboard/badges", label: "Badges", icon: Medal },
] as const;

export const contentNavItems = [
  { href: "/dashboard/blog", label: "Blog", icon: Newspaper },
  { href: "/dashboard/gallery", label: "Gallery", icon: Images },
  { href: "/dashboard/paste", label: "Paste", icon: Clipboard },
  { href: "/dashboard/short", label: "Short links", icon: Link2 },
  { href: "/dashboard/aliases", label: "Aliases", icon: Waypoints },
] as const;

export const discoverNavItems = [
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/views", label: "Analytics", icon: ChartLine },
] as const;

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Longest matching nav href wins (e.g. /dashboard/security → Security). */
export function getDashboardPageTitle(
  pathname: string,
  options: { isAdmin: boolean; verifiedCreator: boolean }
): string {
  const creatorItem: DashboardNavItem = {
    href: "/dashboard/creator",
    label: "Creator",
    icon: Pen,
  };
  const staffItem: DashboardNavItem = {
    href: "/dashboard/staff",
    label: "Staff",
    icon: Settings,
  };

  const main: DashboardNavItem[] = [
    ...(options.verifiedCreator ? [...mainNavItems, creatorItem] : [...mainNavItems]),
  ];
  const all: DashboardNavItem[] = options.isAdmin
    ? [...main, ...contentNavItems, ...discoverNavItems, staffItem]
    : [...main, ...contentNavItems, ...discoverNavItems];

  let best: DashboardNavItem | null = null;
  for (const item of all) {
    const exactDashboard = item.href === "/dashboard" && pathname === "/dashboard";
    const nested = item.href !== "/dashboard" && pathname.startsWith(item.href);
    if (exactDashboard || nested) {
      if (!best || item.href.length > best.href.length) {
        best = item;
      }
    }
  }
  return best?.label ?? "Dashboard";
}
