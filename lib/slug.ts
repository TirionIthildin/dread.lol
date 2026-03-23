/** Max length for profile slugs. */
export const SLUG_MAX_LENGTH = 64;

/** Subdomains reserved for the app (`dashboard.dread.lol`); cannot be member profile slugs. */
const RESERVED_PROFILE_SLUGS = new Set(["dashboard"]);

export function isReservedProfileSlug(slug: string): boolean {
  return RESERVED_PROFILE_SLUGS.has(slug.toLowerCase());
}

/**
 * Normalize a string into a URL-safe slug (lowercase, alphanumeric, hyphens, underscores).
 * Used for profile slugs and slug availability checks.
 */
export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SLUG_MAX_LENGTH) || "";
}

/** Derive an initial slug from a username or display name (e.g. from Discord). */
export function slugFromUsername(username: string): string {
  const normalized = normalizeSlug(username);
  return normalized || "member";
}
