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
  { value: "website", label: "Website", placeholder: "https://…" },
  { value: "custom", label: "Custom", placeholder: "https://…" },
] as const;

export type LinkType = (typeof LINK_TYPES)[number]["value"];

export interface LinkEntry {
  type: LinkType;
  value: string;
  customLabel?: string;
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
            const label = (x as { label?: string }).label?.trim()?.toLowerCase();
            let type: LinkType = "website";
            if (label?.includes("github")) type = "github";
            else if (label?.includes("twitter") || label?.includes("x.com")) type = "twitter";
            else if (label?.includes("youtube")) type = "youtube";
            else if (label?.includes("instagram")) type = "instagram";
            else if (label?.includes("tiktok")) type = "tiktok";
            else if (label?.includes("twitch")) type = "twitch";
            else if (label?.includes("spotify")) type = "spotify";
            else if (label?.includes("linkedin")) type = "linkedin";
            else if (label?.includes("reddit")) type = "reddit";
            else if (label?.includes("steam")) type = "steam";
            else if (label?.includes("paypal")) type = "paypal";
            else if (label?.includes("telegram")) type = "telegram";
            else if (label?.includes("patreon")) type = "patreon";
            else if (label?.includes("medium")) type = "medium";
            else if (label?.includes("mastodon")) type = "mastodon";
            else if (label?.includes("behance")) type = "behance";
            else if (label?.includes("figma")) type = "figma";
            else if (label?.includes("notion")) type = "notion";
            else if (label?.includes("codepen")) type = "codepen";
            else if (label?.includes("dev.to")) type = "devto";
            else if (label?.includes("soundcloud")) type = "soundcloud";
            else if (label?.includes("pinterest")) type = "pinterest";
            else if (label?.includes("threads")) type = "threads";
            else if (label?.includes("whatsapp")) type = "whatsapp";
            else if (label) type = "custom";
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
