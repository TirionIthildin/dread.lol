const CANONICAL_ORIGIN = "https://dread.lol";

/** Canonical site URL. Prefer SITE_URL (runtime) so Docker can set it. */
function resolveSiteUrl(): string {
  const u =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_HOME_URL ||
    CANONICAL_ORIGIN;
  return u.replace(/\/$/, "");
}

/** Site URL and canonical base for metadata, sitemap, Open Graph, etc. */
export const SITE_URL = resolveSiteUrl();

/** Whether the given origin is usable for redirects (no 0.0.0.0, has a real host). */
function isUsableOrigin(origin: string): boolean {
  if (!origin || typeof origin !== "string") return false;
  try {
    const u = new URL(origin);
    const h = u.hostname.toLowerCase();
    if (h === "0.0.0.0" || h === "::1") return false;
    if (!h.includes(".") && h !== "localhost" && !h.startsWith("127.")) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Canonical origin for redirects (checkout, auth callbacks, etc.).
 * Never trusts request headers; always returns a valid public URL.
 */
export function getCanonicalOrigin(): string {
  const url = resolveSiteUrl();
  let result = isUsableOrigin(url) ? url : CANONICAL_ORIGIN;
  if (result.includes("0.0.0.0") || result.includes("127.0.0.1")) {
    result = CANONICAL_ORIGIN;
  }
  if (process.env.DEBUG_CHECKOUT === "1") {
    console.log("[getCanonicalOrigin]", {
      result,
      resolved: url,
      usable: isUsableOrigin(url),
      envSource: process.env.SITE_URL ? "SITE_URL" : process.env.NEXT_PUBLIC_SITE_URL ? "NEXT_PUBLIC_SITE_URL" : process.env.NEXT_PUBLIC_HOME_URL ? "NEXT_PUBLIC_HOME_URL" : "fallback",
    });
  }
  return result;
}

/** Origin from request. Use getCanonicalOrigin() for Polar/auth redirects instead. */
export function getOriginFromRequest(request: { nextUrl?: { origin: string }; headers?: Headers }): string {
  const canonical = getCanonicalOrigin();
  if (process.env.NODE_ENV === "production") return canonical;

  const h = request.headers;
  if (!h) return canonical;

  const raw =
    h.get("x-original-host") || h.get("x-forwarded-host") || h.get("host") || h.get("x-real-host") || "";
  const first = raw.split(",")[0]?.trim() ?? "";
  const [hostname] = first ? first.split(":") : ["", ""];
  const proto = h.get("x-forwarded-proto") === "https" ? "https" : "http";

  if (hostname && isUsableOrigin(`${proto}://${hostname}`)) {
    const port = first.includes(":") ? first.split(":")[1] : "";
    const hostPart = port && !["80", "443"].includes(port) ? `${hostname}:${port}` : hostname;
    return `${proto}://${hostPart}`;
  }

  const nextOrigin = request.nextUrl?.origin;
  if (nextOrigin && isUsableOrigin(nextOrigin)) return nextOrigin;

  return canonical;
}

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
