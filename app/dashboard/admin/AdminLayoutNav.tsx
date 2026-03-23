"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  Users,
  Shield,
  GridFour,
  CreditCard,
  Star,
  Gift,
  Envelope,
  Pulse,
  Megaphone,
} from "@phosphor-icons/react";

const navItems = [
  { href: "/dashboard/admin/overview", label: "Overview", icon: ChartBar },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/badges", label: "Badges", icon: Shield },
  { href: "/dashboard/admin/templates", label: "Templates", icon: GridFour },
  { href: "/dashboard/admin/shop", label: "Shop", icon: CreditCard },
  { href: "/dashboard/admin/premium-vouchers", label: "Premium vouchers", icon: Gift },
  { href: "/dashboard/admin/resend", label: "Resend", icon: Envelope },
  { href: "/dashboard/admin/monitoring", label: "Monitoring", icon: Pulse },
  { href: "/dashboard/admin/site-notice", label: "Site notice", icon: Megaphone },
  { href: "/dashboard/admin/improvement", label: "Improvement", icon: Star },
] as const;

export default function AdminLayoutNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 flex flex-wrap gap-1 border-b border-[var(--border)] bg-[var(--bg)]/50 px-4 py-1.5"
      aria-label="Admin sections"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isOverview = href === "/dashboard/admin/overview";
        const isActive =
          pathname === href ||
          pathname.startsWith(href + "/") ||
          (isOverview && pathname === "/dashboard/admin");
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
            }`}
          >
            <Icon size={16} weight="regular" className="shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
