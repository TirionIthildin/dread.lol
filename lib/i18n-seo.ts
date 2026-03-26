import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { absoluteLocaleUrl } from "@/lib/i18n-url";

const OG_LOCALE: Record<string, string> = {
  en: "en_US",
  es: "es_ES",
};

const HREFLANG: Record<string, string> = {
  en: "en",
  es: "es",
};

export function ogLocaleForUiLocale(locale: string): string {
  return OG_LOCALE[locale] ?? OG_LOCALE[routing.defaultLocale];
}

export function hreflangForUiLocale(locale: string): string {
  return HREFLANG[locale] ?? HREFLANG[routing.defaultLocale];
}

/** Alternate language URLs for a pathname without locale prefix (e.g. `/`, `/about`). */
export function languageAlternates(pathname: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[hreflangForUiLocale(locale)] = absoluteLocaleUrl(pathname, locale);
  }
  return {
    canonical: absoluteLocaleUrl(pathname, routing.defaultLocale),
    languages,
  };
}
