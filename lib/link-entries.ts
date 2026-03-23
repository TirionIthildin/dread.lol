/** Shared link type options and parsing for profile links / button links. */
import type { ProfileRow } from "@/lib/db/schema";

export const LINK_TYPES = [
  { value: "discord", label: "Discord", placeholder: "e.g. @username" },
  { value: "roblox", label: "Roblox", placeholder: "https://www.roblox.com/users/…/profile" },
  { value: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { value: "twitter", label: "Twitter / X", placeholder: "https://x.com/username" },
  { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/…" },
  { value: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { value: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username" },
  { value: "twitch", label: "Twitch", placeholder: "https://twitch.tv/username" },
  { value: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/…" },
  { value: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { value: "reddit", label: "Reddit", placeholder: "https://reddit.com/user/username" },
  { value: "steam", label: "Steam", placeholder: "https://steamcommunity.com/id/…" },
  { value: "paypal", label: "PayPal", placeholder: "https://paypal.me/username" },
  { value: "telegram", label: "Telegram", placeholder: "https://t.me/username" },
  { value: "patreon", label: "Patreon", placeholder: "https://patreon.com/username" },
  { value: "medium", label: "Medium", placeholder: "https://medium.com/@username" },
  { value: "mastodon", label: "Mastodon", placeholder: "https://mastodon.social/@username" },
  { value: "behance", label: "Behance", placeholder: "https://behance.net/username" },
  { value: "figma", label: "Figma", placeholder: "https://figma.com/@username" },
  { value: "notion", label: "Notion", placeholder: "https://notion.so/…" },
  { value: "codepen", label: "CodePen", placeholder: "https://codepen.io/username" },
  { value: "devto", label: "Dev.to", placeholder: "https://dev.to/username" },
  { value: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/username" },
  { value: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/username" },
  { value: "threads", label: "Threads", placeholder: "https://threads.net/@username" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/…" },
  { value: "kofi", label: "Ko-fi", placeholder: "https://ko-fi.com/…" },
  { value: "throne", label: "Throne", placeholder: "https://throne.com/…" },
  { value: "amazonWishlist", label: "Amazon wishlist", placeholder: "https://www.amazon.com/hz/wishlist/…" },
  { value: "website", label: "Website", placeholder: "https://…" },
  { value: "custom", label: "Custom", placeholder: "https://…" },
] as const;

export type LinkType = (typeof LINK_TYPES)[number]["value"];

export interface LinkEntry {
  type: LinkType;
  value: string;
  customLabel?: string;
}

function hrefHostAndPath(href: string): string {
  try {
    const u = new URL(href.includes("://") ? href : `https://${href}`);
    return `${u.hostname.toLowerCase()}${u.pathname.toLowerCase()}`;
  } catch {
    return href.toLowerCase();
  }
}

/**
 * Infer link type from stored label + URL (used for dashboard edit + Premium filtering).
 */
export function resolveLinkTypeFromSavedLink(label: string | undefined, href: string): LinkType {
  const h = hrefHostAndPath(href);
  const l = (label ?? "").toLowerCase();

  if (h.includes("ko-fi.com") || l.includes("ko-fi") || l.includes("kofi")) return "kofi";
  if (h.includes("throne.com") || l.includes("throne")) return "throne";
  if (
    (h.includes("amazon.") && (h.includes("/wishlist") || h.includes("/hz/wishlist") || h.includes("/gp/registry/wishlist"))) ||
    l.includes("amazon wishlist")
  ) {
    return "amazonWishlist";
  }

  if (l.includes("github")) return "github";
  if (l.includes("twitter") || l.includes("x.com")) return "twitter";
  if (l.includes("youtube")) return "youtube";
  if (l.includes("instagram")) return "instagram";
  if (l.includes("tiktok")) return "tiktok";
  if (l.includes("twitch")) return "twitch";
  if (l.includes("spotify")) return "spotify";
  if (l.includes("linkedin")) return "linkedin";
  if (l.includes("reddit")) return "reddit";
  if (l.includes("steam")) return "steam";
  if (l.includes("paypal")) return "paypal";
  if (l.includes("telegram")) return "telegram";
  if (l.includes("patreon")) return "patreon";
  if (l.includes("medium")) return "medium";
  if (l.includes("mastodon")) return "mastodon";
  if (l.includes("behance")) return "behance";
  if (l.includes("figma")) return "figma";
  if (l.includes("notion")) return "notion";
  if (l.includes("codepen")) return "codepen";
  if (l.includes("dev.to")) return "devto";
  if (l.includes("soundcloud")) return "soundcloud";
  if (l.includes("pinterest")) return "pinterest";
  if (l.includes("threads")) return "threads";
  if (l.includes("whatsapp")) return "whatsapp";
  if (label?.trim()) return "custom";
  return "website";
}

export function parseLinkEntries(profile: Pick<ProfileRow, "discord" | "roblox" | "links">): LinkEntry[] {
  const entries: LinkEntry[] = [];
  if (profile.discord?.trim()) entries.push({ type: "discord", value: profile.discord.trim() });
  if (profile.roblox?.trim()) entries.push({ type: "roblox", value: profile.roblox.trim() });
  if (profile.links?.trim()) {
    try {
      const arr = JSON.parse(profile.links) as unknown;
      if (Array.isArray(arr)) {
        for (const x of arr) {
          if (x && typeof (x as { href?: string }).href === "string") {
            const href = (x as { href: string }).href.trim();
            const rawLabel = (x as { label?: string }).label;
            const type = resolveLinkTypeFromSavedLink(rawLabel, href);
            entries.push({
              type,
              value: href,
              customLabel: type === "custom" ? (x as { label: string }).label : undefined,
            });
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return entries;
}

export function linkEntriesToFormPayload(entries: LinkEntry[]): { discord: string; roblox: string; linksJson: string } {
  let discord = "";
  let roblox = "";
  const links: { label: string; href: string }[] = [];
  for (const e of entries) {
    if (!e.value.trim()) continue;
    if (e.type === "discord") {
      if (!discord) discord = e.value.trim();
    } else if (e.type === "roblox") {
      if (!roblox) roblox = e.value.trim();
    } else {
      const label =
        e.type === "custom" && e.customLabel?.trim()
          ? e.customLabel.trim()
          : LINK_TYPES.find((t) => t.value === e.type)?.label ?? "Link";
      links.push({ label, href: e.value.trim() });
    }
  }
  return { discord, roblox, linksJson: links.length ? JSON.stringify(links) : "" };
}
