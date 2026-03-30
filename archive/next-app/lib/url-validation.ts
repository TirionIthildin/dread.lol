/**
 * URL helpers for safe hrefs and host checks (avoids incomplete substring checks on URLs).
 */

/** Discord CDN image host (avatars, attachments, etc.). */
export function isDiscordCdnHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      u.protocol === "https:" &&
      u.username === "" &&
      u.password === "" &&
      u.hostname.toLowerCase() === "cdn.discordapp.com"
    );
  } catch {
    return false;
  }
}

/** True if the value is a safe relative path or http(s) URL for Next/Image `src`. */
export function isHttpOrRelativePathForMedia(url: string): boolean {
  const t = url.trim();
  if (t.startsWith("/") && !t.startsWith("//")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Href for opening an image in a new tab: same-origin paths or http(s) only.
 * Blocks javascript:, data:, etc.
 */
export function safeImageLinkHref(url: string): string {
  const t = url.trim();
  // Same-origin path only; reject protocol-relative `//host` (would bypass naive `/` checks).
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  try {
    const u = new URL(t);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch {
    /* ignore */
  }
  return "#";
}
