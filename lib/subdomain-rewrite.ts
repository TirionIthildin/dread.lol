/**
 * Maps a wildcard subdomain label + browser pathname to the internal Next.js pathname.
 * Used by middleware; keep in sync with debug `/api/debug/headers`.
 */

export type SubdomainRewriteKind = "dashboard" | "profile";

/**
 * Profile: `alice.dread.lol/foo` → `/alice/foo`.
 * Dashboard app: `dashboard.dread.lol/` → `/dashboard`; links use `/dashboard/...` so those paths pass through unchanged.
 */
export function rewriteSubdomainPath(slug: string, pathname: string): string {
  if (slug === "dashboard") {
    if (pathname === "/") return "/dashboard";
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return pathname;
    return `/dashboard${pathname}`;
  }
  if (pathname === "/") return `/${slug}`;
  return `/${slug}${pathname}`;
}

export function getSubdomainRewriteKind(slug: string | null): SubdomainRewriteKind | null {
  if (!slug) return null;
  return slug === "dashboard" ? "dashboard" : "profile";
}
