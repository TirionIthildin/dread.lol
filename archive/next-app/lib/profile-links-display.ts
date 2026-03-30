/**
 * Display rules for profile link buttons (portfolio, Roblox, custom rows).
 * When copyable socials is on, only http(s) URLs open in a new tab; other values copy.
 */
import { isSafeLinkHref, validateUrlOrEmpty } from "@/lib/validate-url";

/** Max length for primary website / portfolio field when copyable socials allows non-URL text. */
export const MAX_PROFILE_WEBSITE_URL_LEN = 2048;

/** Max stored length for link row href and label (JSON links array). */
export const MAX_PROFILE_LINK_HREF_LEN = 2048;
export const MAX_PROFILE_LINK_LABEL_LEN = 120;

/** True when the value should render as an opening link (http(s) or safe mailto:). */
export function shouldOpenProfileLink(value: string): boolean {
  return isSafeLinkHref(value.trim());
}

/** Persist primary website field: URL-only unless copyable socials stores arbitrary text. */
export function parseWebsiteUrlForSave(raw: string | null | undefined, copyableSocials: boolean): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (copyableSocials) return v.slice(0, MAX_PROFILE_WEBSITE_URL_LEN);
  return validateUrlOrEmpty(v) ?? null;
}
