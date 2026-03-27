import type { ReactNode } from "react";

type DashboardPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
};

/**
 * Consistent title + description + optional actions row for dashboard sub-pages.
 */
export function DashboardPageHeader({ title, description, children }: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">{title}</h1>
        {description ? (
          <div className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{description}</div>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
