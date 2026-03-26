import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/** Path without locale prefix (e.g. `/`, `/about`). */
export function localeHref(pathname: string, locale: string): string {
  const p = pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) {
    return p;
  }
  if (p === "/") {
    return `/${locale}`;
  }
  return `/${locale}${p}`;
}

export function absoluteLocaleUrl(pathname: string, locale: string): string {
  const path = localeHref(pathname, locale);
  return `${SITE_URL.replace(/\/$/, "")}${path}`;
}
