/**
 * Site URL and canonical base for metadata, sitemap, Open Graph, etc.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_HOME_URL ||
  "https://dread.lol";

/** Base domain (e.g. "dread.lol"). Used for subdomain detection and cookie domain. */
export function getBaseDomain(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_DOMAIN?.trim();
  if (explicit) return explicit.replace(/^www\./i, "");
  try {
    const host = new URL(SITE_URL).hostname;
    return host.replace(/^www\./i, "");
  } catch {
    return "dread.lol";
  }
}

/** Cookie domain for subdomain sharing (e.g. ".dread.lol"). Undefined for localhost. */
export function getCookieDomain(): string | undefined {
  const base = getBaseDomain();
  if (!base || base === "localhost" || base.startsWith("127.")) return undefined;
  return `.${base}`;
}

export const SITE_NAME = "Dread.Lol" as const;
export const SITE_DESCRIPTION = "Accessing the terminal." as const;

/** Default OG/Twitter image. Use absolute URL for social crawlers. */
export const SITE_OG_IMAGE = `${SITE_URL}/logo.png`;
