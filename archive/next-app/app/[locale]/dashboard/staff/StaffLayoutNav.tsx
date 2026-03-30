"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  Shield,
  LayoutGrid,
  CreditCard,
  Star,
  Gift,
  Mail,
  Activity,
  Megaphone,
  Flag,
  Bot,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/staff/overview", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/staff/users", label: "Users", icon: Users },
  { href: "/dashboard/staff/reports", label: "Reports", icon: Flag },
  { href: "/dashboard/staff/discord-bot", label: "Discord bot", icon: Bot },
  { href: "/dashboard/staff/badges", label: "Badges", icon: Shield },
  { href: "/dashboard/staff/templates", label: "Templates", icon: LayoutGrid },
  { href: "/dashboard/staff/shop", label: "Shop", icon: CreditCard },
  { href: "/dashboard/staff/premium-vouchers", label: "Premium vouchers", icon: Gift },
  { href: "/dashboard/staff/resend", label: "Resend", icon: Mail },
  { href: "/dashboard/staff/monitoring", label: "Monitoring", icon: Activity },
  { href: "/dashboard/staff/site-notice", label: "Site notice", icon: Megaphone },
  { href: "/dashboard/staff/improvement", label: "Improvement", icon: Star },
] as const;

export default function StaffLayoutNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 flex flex-wrap gap-1 border-b border-[var(--border)] bg-[var(--bg)]/50 px-4 py-1.5"
      aria-label="Staff sections"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isOverview = href === "/dashboard/staff/overview";
        const isActive =
          pathname === href ||
          pathname.startsWith(href + "/") ||
          (isOverview && pathname === "/dashboard/staff");
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
            <Icon size={16} className="shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
