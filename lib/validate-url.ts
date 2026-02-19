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
 * Validates background URL: allows https/http or same-origin paths (e.g. /api/files/xxx).
 */
export function validateBackgroundUrl(url: string | null | undefined): string | undefined {
  const trimmed = (url ?? "").toString().trim();
  if (!trimmed) return undefined;
  if (isSafeUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  return undefined;
}
