/**
 * Site URL and canonical base for metadata, sitemap, Open Graph, etc.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_HOME_URL ||
  "https://dread.lol";

const INTERNAL_HOSTS = ["0.0.0.0", "127.0.0.1", "localhost", "::1"];

function isInternalHost(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase().trim() ?? "";
  return INTERNAL_HOSTS.includes(h) || h.startsWith("127.");
}

/** Host looks like a public domain (e.g. dread.lol), not internal (dread, 0.0.0.0). */
function looksLikePublicHost(hostname: string): boolean {
  const h = hostname.toLowerCase().trim();
  if (!h) return false;
  // Allow localhost/127.0.0.1 for local dev
  if (h === "localhost" || h.startsWith("127.")) return true;
  if (h === "0.0.0.0" || h === "::1") return false;
  // Single-word hostnames are typically Docker/service names (dread, mongodb, etc.)
  if (!h.includes(".")) return false;
  return true;
}

const isTesting = process.env.NODE_ENV !== "production";

/** Origin from request. In production, use SITE_URL (dread.lol) by default. In dev/testing, derive from request. */
export function getOriginFromRequest(request: { nextUrl?: { origin: string }; headers?: Headers }): string {
  if (!isTesting) return SITE_URL;

  const h = request.headers;
  if (!h) return SITE_URL;

  const raw =
    h.get("x-original-host") || h.get("x-forwarded-host") || h.get("host") || h.get("x-real-host") || "";
  const first = raw.split(",")[0]?.trim() ?? "";
  const [hostname, port] = first ? first.split(":") : ["", ""];
  const proto = h.get("x-forwarded-proto") === "https" ? "https" : h.get("x-forwarded-proto") === "http" ? "http" : "http";

  if (hostname && looksLikePublicHost(hostname)) {
    const hostPart = port && !["80", "443"].includes(port) ? `${hostname}:${port}` : hostname;
    return `${proto}://${hostPart}`;
  }

  const nextOrigin = request.nextUrl?.origin;
  if (nextOrigin) {
    try {
      const u = new URL(nextOrigin);
      if (looksLikePublicHost(u.hostname)) return nextOrigin;
    } catch {
      /* ignore */
    }
  }

  return SITE_URL;
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
