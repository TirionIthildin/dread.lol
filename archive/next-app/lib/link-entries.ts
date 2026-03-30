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
  { value: "cryptoWallet", label: "Crypto / wallet", placeholder: "https://coinbase.com/… or exchange profile" },
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
  { value: "onlyfans", label: "OnlyFans", placeholder: "https://onlyfans.com/…" },
  { value: "namemc", label: "NameMC", placeholder: "https://namemc.com/profile/…" },
  { value: "email", label: "Email", placeholder: "you@example.com or mailto:…" },
  { value: "website", label: "Website", placeholder: "https://…" },
  { value: "custom", label: "Custom", placeholder: "https://…" },
] as const;

export type LinkType = (typeof LINK_TYPES)[number]["value"];

export interface LinkEntry {
  type: LinkType;
  value: string;
  customLabel?: string;
  /** Lucide icon name (PascalCase); only used when type is `custom`. */
  customIconName?: string;
}

/** True if the string looks like a bare email (no scheme). */
export function looksLikeBareEmail(s: string): boolean {
  const t = s.trim();
  if (!t || t.includes(" ") || t.includes("\n")) return false;
  // Reject values that parse as URLs with a scheme (http:, mailto:, etc.).
  if (/^\w[\w+.-]*:/.test(t)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/** Normalize href for persistence (e.g. bare email → mailto:). */
export function normalizeHrefForLinkType(type: LinkType, value: string): string {
  const v = value.trim();
  if (type === "email") {
    if (v.toLowerCase().startsWith("mailto:")) return v;
    if (looksLikeBareEmail(v)) return `mailto:${v}`;
  }
  return v;
}

/** Match retail Amazon hostnames (avoids substring tricks on path-only matches). */
function isAmazonRetailHostname(hostname: string): boolean {
  const suffixes = [
    "amazon.com",
    "amazon.co.uk",
    "amazon.de",
    "amazon.fr",
    "amazon.it",
    "amazon.es",
    "amazon.nl",
    "amazon.pl",
    "amazon.se",
    "amazon.com.be",
    "amazon.com.tr",
    "amazon.in",
    "amazon.jp",
    "amazon.com.au",
    "amazon.com.mx",
    "amazon.com.br",
    "amazon.ca",
    "amazon.cn",
  ];
  const h = hostname.toLowerCase();
  return suffixes.some((s) => h === s || h.endsWith(`.${s}`));
}

/** Wishlist-related paths on retail Amazon hosts (segment-based, not substring tricks). */
function pathnameIndicatesAmazonWishlist(pathname: string): boolean {
  const segments = pathname.toLowerCase().split("/").filter(Boolean);
  if (segments.includes("wishlist")) return true;
  const hz = segments.indexOf("hz");
  if (hz >= 0 && segments[hz + 1] === "wishlist") return true;
  return segments.includes("registry") && segments.includes("wishlist");
}

/**
 * Infer link type from stored label + URL (used for dashboard edit + Premium filtering).
 */
function isCryptoExchangeOrWalletHost(hostname: string): boolean {
  const domains = [
    "coinbase.com",
    "binance.com",
    "binance.us",
    "kraken.com",
    "gemini.com",
    "crypto.com",
    "okx.com",
    "bybit.com",
    "metamask.io",
    "ledger.com",
    "trezor.io",
    "rainbow.me",
    "phantom.app",
    "exodus.com",
    "blockchain.com",
    "kucoin.com",
    "gate.io",
    "huobi.com",
    "bitstamp.net",
    "cex.io",
    "robinhood.com",
  ];
  const h = hostname.toLowerCase();
  return domains.some((d) => h === d || h.endsWith(`.${d}`));
}

export function resolveLinkTypeFromSavedLink(label: string | undefined, href: string): LinkType {
  const l = (label ?? "").toLowerCase();
  const trimmed = href.trim();
  if (trimmed.toLowerCase().startsWith("mailto:")) return "email";
  if (looksLikeBareEmail(trimmed)) return "email";

  let hostname: string;
  let pathname: string;
  try {
    const raw = trimmed;
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (u.protocol === "mailto:") return "email";
    hostname = u.hostname.toLowerCase();
    pathname = u.pathname.toLowerCase();
  } catch {
    return label?.trim() ? "custom" : "website";
  }

  if (isCryptoExchangeOrWalletHost(hostname)) return "cryptoWallet";

  if (hostname === "onlyfans.com" || hostname.endsWith(".onlyfans.com")) return "onlyfans";
  if (hostname === "namemc.com" || hostname.endsWith(".namemc.com")) return "namemc";

  if (hostname === "ko-fi.com" || hostname.endsWith(".ko-fi.com") || l.includes("ko-fi") || l.includes("kofi")) return "kofi";
  if (hostname === "throne.com" || hostname.endsWith(".throne.com") || l.includes("throne")) return "throne";
  if (
    (isAmazonRetailHostname(hostname) && pathnameIndicatesAmazonWishlist(pathname)) ||
    l.includes("amazon wishlist")
  ) {
    return "amazonWishlist";
  }

  if (l.includes("onlyfans")) return "onlyfans";
  if (l.includes("namemc")) return "namemc";

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
            const iconRaw = (x as { iconName?: string }).iconName;
            entries.push({
              type,
              value: href,
              customLabel: type === "custom" ? (x as { label: string }).label : undefined,
              customIconName: type === "custom" && typeof iconRaw === "string" && iconRaw.trim() ? iconRaw.trim() : undefined,
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
  const links: { label: string; href: string; iconName?: string }[] = [];
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
      const href = normalizeHrefForLinkType(e.type, e.value);
      const row: { label: string; href: string; iconName?: string } = { label, href };
      if (e.type === "custom" && e.customIconName?.trim()) {
        row.iconName = e.customIconName.trim();
      }
      links.push(row);
    }
  }
  return { discord, roblox, linksJson: links.length ? JSON.stringify(links) : "" };
}
