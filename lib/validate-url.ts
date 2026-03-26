/** Allowed protocols for user-submitted URLs (avatars, banners, links, etc.). */
const SAFE_PROTOCOLS = ["https:", "http:"];

/**
 * Validates that a URL uses a safe protocol (https or http).
 * Rejects javascript:, data:, and other unsafe schemes.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const protocol = new URL(trimmed).protocol.toLowerCase();
    return SAFE_PROTOCOLS.includes(protocol);
  } catch {
    return false;
  }
}

/** Single-address mailto: path (no embedded scripts, no newline tricks). */
function isSafeMailtoHref(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed.toLowerCase().startsWith("mailto:")) return false;
  try {
    const u = new URL(trimmed);
    if (u.protocol.toLowerCase() !== "mailto:") return false;
    const addrPart = decodeURIComponent(u.pathname);
    if (/[\r\n<>]/.test(addrPart) || /[\r\n<>]/.test(u.search)) return false;
    if (!addrPart || addrPart.length > 320) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addrPart);
  } catch {
    return false;
  }
}

/** Safe for profile link buttons: http(s) URLs or single-address mailto: links. */
export function isSafeLinkHref(href: string | null | undefined): boolean {
  if (!href || typeof href !== "string") return false;
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (isSafeMailtoHref(trimmed)) return true;
  return isSafeUrl(trimmed);
}

/**
 * Returns the trimmed URL if valid, or undefined. Use for optional URL fields.
 */
export function validateUrlOrEmpty(url: string | null | undefined): string | undefined {
  const trimmed = (url ?? "").toString().trim();
  if (!trimmed) return undefined;
  return isSafeUrl(trimmed) ? trimmed : undefined;
}

/**
 * Validates URL and throws if invalid. Use when URL is required.
 */
export function requireSafeUrl(url: string, fieldName = "URL"): string {
  const trimmed = url.trim();
  if (!trimmed) throw new Error(`${fieldName} is required`);
  if (!isSafeUrl(trimmed)) throw new Error(`${fieldName} must use https or http`);
  return trimmed;
}

/**
 * Requires an absolute http(s) URL or a same-origin path (e.g. `/api/files/…` from uploads).
 */
export function requireHttpOrSameOriginPath(url: string, fieldName = "URL"): string {
  const trimmed = url.trim();
  if (!trimmed) throw new Error(`${fieldName} is required`);
  const ok = validateBackgroundUrl(trimmed);
  if (!ok) throw new Error(`${fieldName} must use https or http or a valid path`);
  return ok;
}

/**
 * Validates background URL: allows https/http or same-origin paths (e.g. /api/files/xxx).
 */
export function validateBackgroundUrl(url: string | null | undefined): string | undefined {
  const trimmed = (url ?? "").toString().trim();
  if (!trimmed) return undefined;
  if (isSafeUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  return undefined;
}

/**
 * Validates URL for safe redirects (OG image, etc.). Only allows same-origin URLs or
 * relative paths to prevent open redirect / phishing.
 */
export function validateRedirectUrl(
  url: string | null | undefined,
  origin?: string
): string | undefined {
  const trimmed = (url ?? "").toString().trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (!SAFE_PROTOCOLS.includes(parsed.protocol.toLowerCase())) return undefined;
    const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "https://dread.lol");
    return parsed.origin === new URL(base).origin ? trimmed : undefined;
  } catch {
    return undefined;
  }
}
