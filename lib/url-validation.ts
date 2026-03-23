/**
 * URL helpers for safe hrefs and host checks (avoids incomplete substring checks on URLs).
 */

/** Discord CDN image host (avatars, attachments, etc.). */
export function isDiscordCdnHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" && u.hostname.toLowerCase() === "cdn.discordapp.com";
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
  if (t.startsWith("/")) return t;
  try {
    const u = new URL(t);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch {
    /* ignore */
  }
  return "#";
}
