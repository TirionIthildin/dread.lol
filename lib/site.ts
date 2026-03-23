const CANONICAL_ORIGIN = "https://dread.lol";

/** Canonical site URL. Prefer SITE_URL (runtime) so Docker can set it. */
function resolveSiteUrl(): string {
  const u =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_HOME_URL ||
    CANONICAL_ORIGIN;
  const base = u.replace(/\/$/, "");
  // Never use internal/bind addresses - Docker/Coolify may inject wrong env (e.g. 0.0.0.0:3000)
  if (base.includes("0.0.0.0") || base.includes("127.0.0.1")) {
    return CANONICAL_ORIGIN;
  }
  return base;
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
 * Uses SITE_URL / NEXT_PUBLIC_SITE_URL when set; falls back to CANONICAL_ORIGIN.
 */
export function getCanonicalOrigin(): string {
  const u =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_HOME_URL ||
    CANONICAL_ORIGIN;
  const base = u.replace(/\/$/, "");
  if (base.includes("0.0.0.0") || base.includes("127.0.0.1")) {
    return CANONICAL_ORIGIN;
  }
  return base;
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

/**
 * Parent domain for `Set-Cookie` `Domain` so the session is sent on apex and all subdomains
 * (`dread.lol`, `dashboard.dread.lol`, `*.dread.lol`). Uses `NEXT_PUBLIC_SITE_DOMAIN` or the
 * hostname from `SITE_URL` (www stripped). Returns `undefined` on localhost so the cookie is host-only.
 */
export function getCookieDomain(): string | undefined {
  const base = getBaseDomain();
  if (!base || base === "localhost" || base.startsWith("127.")) return undefined;
  return `.${base}`;
}

/**
 * Whether session cookies use the `Secure` flag. Production uses HTTPS; set `SECURE_COOKIE=false`
 * only for rare local HTTP tests against a production build.
 */
export function shouldUseSecureCookies(): boolean {
  if (process.env.SECURE_COOKIE === "false") return false;
  if (process.env.SECURE_COOKIE === "true") return true;
  return process.env.NODE_ENV === "production";
}

export const SITE_NAME = "Dread.Lol" as const;
export const SITE_DESCRIPTION = "Accessing the terminal." as const;

/** Default OG/Twitter image. Use absolute URL for social crawlers. */
export const SITE_OG_IMAGE = `${SITE_URL}/logo.png`;
