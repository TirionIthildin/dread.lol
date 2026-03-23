/** Normalize login username: lowercase, allowed chars only. */
export function normalizeLocalUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
}

export function isValidLocalUsername(normalized: string): boolean {
  return normalized.length >= 3 && normalized.length <= 32;
}

/** RFC 5322-lite normalization for storage. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
