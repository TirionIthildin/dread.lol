/**
 * Site URL and canonical base for metadata, sitemap, Open Graph, etc.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_HOME_URL ||
  "https://dread.lol";

export const SITE_NAME = "Dread.Lol" as const;
export const SITE_DESCRIPTION =
  "Profiles for friends — Klass, Balatro, Tirion, and more." as const;

/** Default OG/Twitter image. Use absolute URL for social crawlers. */
export const SITE_OG_IMAGE = `${SITE_URL}/logo.png`;
