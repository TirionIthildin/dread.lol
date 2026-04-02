"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

function isProfileEditorPath(pathname: string | null): boolean {
  return pathname?.includes("/dashboard/profile-editor") ?? false;
}

type DashboardShellProps = {
  /** Renders inside main when site notice is enabled; horizontal padding is applied on the profile editor route. */
  dashboardNotice: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
};

/**
 * Hides the main dashboard sidebar on the profile editor route so the editor section rail can occupy that column.
 */
export function DashboardShell({ dashboardNotice, sidebar, children }: DashboardShellProps) {
  const pathname = usePathname();
  const profileEditor = isProfileEditorPath(pathname);

  const mainClassName = profileEditor
    ? "flex-1 min-w-0 min-h-0 flex flex-col !max-w-none w-full px-0 py-4 md:py-6 md:!max-w-[96rem]"
    : "flex-1 min-w-0 flex flex-col content-container py-4 md:py-6 md:!max-w-[96rem]";

  const skipNavHref = profileEditor ? "#profile-editor-section-nav" : "#dashboard-sidebar";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[var(--bg)] focus:font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:[clip:auto] focus:[margin:0]"
      >
        Skip to content
      </a>
      <a
        href={skipNavHref}
        className="sr-only focus:fixed focus:left-4 focus:top-20 focus:z-[100] focus:block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-lg focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[var(--bg)] focus:font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:[clip:auto] focus:[margin:0]"
      >
        Skip to navigation
      </a>
      {!profileEditor && (
        <aside
          id="dashboard-sidebar"
          tabIndex={-1}
          className="sticky top-0 z-40 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl font-mono md:w-56 lg:w-64 md:max-h-screen outline-none"
        >
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{sidebar}</div>
        </aside>
      )}
      <main id="main-content" className={mainClassName} tabIndex={-1}>
        {dashboardNotice ? (
          <div className={`mb-4 shrink-0 ${profileEditor ? "px-4 sm:px-6 lg:px-8" : ""}`}>{dashboardNotice}</div>
        ) : null}
        {children}
      </main>
    </>
  );
}
