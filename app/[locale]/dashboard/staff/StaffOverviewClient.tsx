"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Users,
  CircleUser,
  LineChart,
  Store,
  CreditCard,
  Receipt,
  Images,
  Newspaper,
  Handshake,
  Medal,
  ArrowRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";

type Analytics = {
  users: number;
  profiles: number;
  signupsLast7Days: number;
  signupsLast30Days: number;
  templatesPublished: number;
  templatesAppliedTotal: number;
  polarSubscriptionsActive: number;
  polarOrdersPaid: number;
  profileViewsLast7Days: number;
  pastes: number;
  galleryItems: number;
  blogPosts: number;
  vouches: number;
  customBadges: number;
  recentUsers: Array<{
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string | null;
  }>;
};

const statCards: {
  key: keyof Analytics;
  label: string;
  icon: React.ElementType;
  href?: string;
}[] = [
  { key: "users", label: "Total users", icon: Users, href: "/dashboard/staff/users" },
  { key: "profiles", label: "Profiles", icon: CircleUser },
  { key: "signupsLast7Days", label: "Signups (7d)", icon: TrendingUp },
  { key: "signupsLast30Days", label: "Signups (30d)", icon: BarChart3 },
  { key: "profileViewsLast7Days", label: "Profile views (7d)", icon: LineChart },
  { key: "templatesPublished", label: "Templates", icon: Store, href: "/dashboard/staff/templates" },
  { key: "templatesAppliedTotal", label: "Template applies", icon: Store },
  { key: "polarSubscriptionsActive", label: "Active subscriptions", icon: CreditCard, href: "/dashboard/staff/shop" },
  { key: "polarOrdersPaid", label: "Paid orders", icon: Receipt },
  { key: "galleryItems", label: "Gallery items", icon: Images },
  { key: "blogPosts", label: "Blog posts", icon: Newspaper },
  { key: "pastes", label: "Pastes", icon: Newspaper },
  { key: "vouches", label: "Vouches", icon: Handshake },
  { key: "customBadges", label: "Custom badges", icon: Medal, href: "/dashboard/staff/badges" },
];

export default function StaffOverviewClient() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/staff/analytics")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then(setAnalytics)
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-[var(--surface)]" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[var(--surface)]" />
            ))}
          </div>
          <div className="h-48 rounded-xl bg-[var(--surface)]" />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/5 p-4">
          <p className="text-sm text-[var(--warning)]">{error ?? "Failed to load"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Service analytics</h2>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Overview of platform usage and activity
        </p>
      </div>

      <section>
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Core metrics</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statCards.map(({ key, label, icon: Icon, href }) => {
            const value = analytics[key];
            if (typeof value !== "number") return null;
            const content = (
              <div
                className={`rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4 flex items-start justify-between gap-3 transition-colors ${
                  href ? "hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--muted)] truncate">{label}</p>
                  <p className="text-2xl font-semibold text-[var(--foreground)] mt-1 tabular-nums">
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </p>
                </div>
                <div className="shrink-0 rounded-lg p-2 bg-[var(--surface)]">
                  <Icon size={20} className="text-[var(--accent)]" />
                </div>
              </div>
            );
            return href ? (
              <Link key={key} href={href} className="block">
                {content}
              </Link>
            ) : (
              <div key={key}>{content}</div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Recent signups</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">Last 5 users</p>
          </div>
          <div className="p-2">
            {analytics.recentUsers?.length > 0 ? (
              <ul className="space-y-1">
                {analytics.recentUsers.map((u) => {
                  const displayName = u.displayName || u.username || `User ${u.id?.slice(0, 8)}…`;
                  const date = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";
                  return (
                    <li key={u.id}>
                      <Link
                        href={`/dashboard/staff/users`}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        {u.avatarUrl ? (
                          <Image
                            src={u.avatarUrl}
                            alt=""
                            className="h-9 w-9 rounded-full border border-[var(--border)] shrink-0"
                            width={36}
                            height={36}
                            unoptimized
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full border border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center justify-center text-xs text-[var(--muted)]">
                            ?
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-[var(--muted)] truncate">
                            {u.username ? `@${u.username}` : u.id}
                          </p>
                        </div>
                        <span className="text-xs text-[var(--muted)] shrink-0">{date}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-8 text-sm text-[var(--muted)] text-center">
                No users yet
              </p>
            )}
          </div>
          <Link
            href="/dashboard/staff/users"
            className="flex items-center justify-center gap-2 px-4 py-2 border-t border-[var(--border)] text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors"
          >
            View all users
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Quick links</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">Admin sections</p>
          </div>
          <nav className="p-2 space-y-1">
            {[
              { href: "/dashboard/staff/users", label: "User management", icon: Users },
              { href: "/dashboard/staff/badges", label: "Badges", icon: Medal },
              { href: "/dashboard/staff/templates", label: "Templates", icon: Store },
              { href: "/dashboard/staff/shop", label: "Shop & billing", icon: CreditCard },
              { href: "/dashboard/staff/improvement", label: "Improvement", icon: BarChart3 },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
              >
                <Icon size={18} className="shrink-0 text-[var(--accent)]" />
                {label}
                <ArrowRight size={14} className="ml-auto shrink-0 opacity-50" />
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
}
