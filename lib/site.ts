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

/** Origin from request (e.g. http://localhost:3000 when dev). Use for redirects so users stay on current host. */
export function getOriginFromRequest(request: { nextUrl?: { origin: string }; headers?: Headers }): string {
  const h = request.headers;
  if (!h) return SITE_URL;

  // Prefer proxy headers (Coolify/Traefik/Cloudflare set these for the real client host)
  const raw =
    h.get("x-original-host") || h.get("x-forwarded-host") || h.get("host") || h.get("x-real-host") || "";
  const first = raw.split(",")[0]?.trim() ?? "";
  const [hostname, port] = first ? first.split(":") : ["", ""];
  const proto = h.get("x-forwarded-proto") === "https" ? "https" : h.get("x-forwarded-proto") === "http" ? "http" : "https";

  if (hostname && !isInternalHost(hostname)) {
    const hostPart = port && !["80", "443"].includes(port) ? `${hostname}:${port}` : hostname;
    return `${proto}://${hostPart}`;
  }

  // Fallback: nextUrl.origin only if it's not internal
  const nextOrigin = request.nextUrl?.origin;
  if (nextOrigin) {
    try {
      const u = new URL(nextOrigin);
      if (!isInternalHost(u.hostname)) return nextOrigin;
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
