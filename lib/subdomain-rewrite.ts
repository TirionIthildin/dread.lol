/**
 * Maps a wildcard subdomain label + browser pathname to the internal Next.js pathname.
 * Used by proxy (subdomain rewrite); keep in sync with debug `/api/debug/headers`.
 */
import { routing } from "@/i18n/routing";

export type SubdomainRewriteKind = "dashboard" | "profile";

const LOCALE_SET = new Set(routing.locales.map((l) => l.toLowerCase()));

function splitLocalePrefix(pathname: string): { locale: string | null; restPath: string } {
  const m = pathname.match(/^\/([^/]+)(\/.*)?$/);
  const first = (m?.[1] ?? "").toLowerCase();
  if (!first || !LOCALE_SET.has(first)) {
    return { locale: null, restPath: pathname };
  }
  return { locale: first, restPath: m?.[2] ?? "/" };
}

/**
 * Profile: `alice.dread.lol/foo` → `/alice/foo`.
 * Dashboard app: `dashboard.dread.lol/` → `/dashboard`; links use `/dashboard/...` so those paths pass through unchanged.
 */
export function rewriteSubdomainPath(slug: string, pathname: string): string {
  const { locale, restPath } = splitLocalePrefix(pathname);
  const localePrefix = locale ? `/${locale}` : "";

  if (slug === "dashboard") {
    if (restPath === "/") return `${localePrefix}/dashboard`;
    if (restPath === "/dashboard" || restPath.startsWith("/dashboard/")) return `${localePrefix}${restPath}`;
    return `${localePrefix}/dashboard${restPath}`;
  }
  if (restPath === "/") return `${localePrefix}/${slug}`;
  return `${localePrefix}/${slug}${restPath}`;
}

export function getSubdomainRewriteKind(slug: string | null): SubdomainRewriteKind | null {
  if (!slug) return null;
  return slug === "dashboard" ? "dashboard" : "profile";
}
