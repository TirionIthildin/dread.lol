import { Link } from "@/i18n/navigation";
import { ChartLine, CreditCard, ExternalLink, Pencil, Shield, Store } from "lucide-react";
import { getBaseDomain } from "@/lib/site";
import { dashboardPanelClassName } from "@/app/[locale]/dashboard/components/dashboardPanel";

type DashboardHomeHubProps = {
  profileSlug: string;
  displayName: string;
  hasPremium: boolean;
};

const quickIcon =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]";

const quickCardClass = `${dashboardPanelClassName} flex items-center gap-3 p-4 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]/50`;

export function DashboardHomeHub({ profileSlug, displayName, hasPremium }: DashboardHomeHubProps) {
  const domain = getBaseDomain();
  const publicPath = `/${profileSlug}`;

  return (
    <section className="space-y-5" aria-labelledby="dashboard-home-heading">
      <div>
        <h1 id="dashboard-home-heading" className="text-xl font-semibold text-[var(--foreground)]">
          Welcome back{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Jump to common tasks or scroll down to edit your full profile, links, and appearance.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={publicPath} target="_blank" rel="noopener noreferrer" className={quickCardClass}>
          <span className={quickIcon} aria-hidden>
            <ExternalLink size={18} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium text-[var(--foreground)]">Public profile</span>
            <span className="block truncate text-xs text-[var(--muted)]">Open in new tab</span>
          </span>
        </Link>

        <a href="#profile-editor" className={quickCardClass}>
          <span className={quickIcon} aria-hidden>
            <Pencil size={18} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium text-[var(--foreground)]">Profile editor</span>
            <span className="block text-xs text-[var(--muted)]">Jump to editor below</span>
          </span>
        </a>

        <Link href="/dashboard/security" className={quickCardClass}>
          <span className={quickIcon} aria-hidden>
            <Shield size={18} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium text-[var(--foreground)]">Security</span>
            <span className="block text-xs text-[var(--muted)]">2FA and sessions</span>
          </span>
        </Link>

        <Link href="/dashboard/premium" className={quickCardClass}>
          <span className={quickIcon} aria-hidden>
            <CreditCard size={18} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium text-[var(--foreground)]">Premium</span>
            <span className="block text-xs text-[var(--muted)]">Plans and perks</span>
          </span>
        </Link>

        <Link href="/dashboard/marketplace" className={quickCardClass}>
          <span className={quickIcon} aria-hidden>
            <Store size={18} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium text-[var(--foreground)]">Marketplace</span>
            <span className="block text-xs text-[var(--muted)]">Templates and listings</span>
          </span>
        </Link>

        <Link href="/dashboard/views" className={quickCardClass}>
          <span className={quickIcon} aria-hidden>
            <ChartLine size={18} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium text-[var(--foreground)]">Analytics</span>
            <span className="block text-xs text-[var(--muted)]">Profile views</span>
          </span>
        </Link>
      </div>

      <div
        className={`${dashboardPanelClassName} flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm`}
      >
        <p className="text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">Public URL</span>{" "}
          <span className="font-mono text-xs text-[var(--terminal)] sm:text-sm">
            {domain}
            {publicPath}
          </span>
        </p>
        <p className="text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">Premium</span>{" "}
          <span className={hasPremium ? "text-[var(--terminal)]" : ""}>
            {hasPremium ? "Active" : "Not active"}
          </span>
        </p>
      </div>
    </section>
  );
}
