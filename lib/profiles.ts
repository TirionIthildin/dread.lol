/**
 * Profile type used by profile pages. Static profiles removed;
 * use profile templates in the dashboard instead.
 */
export interface Profile {
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  /** Profile avatar image URL (e.g. Discord CDN). */
  avatar?: string;
  /** Optional ASCII banner shown at top of profile (e.g. KLASSY art). */
  banner?: string;
  /** Discord username (e.g. @qwe301). Click-to-copy. */
  discord?: string;
  /** Roblox profile URL. Link opens in new tab. */
  roblox?: string;
  /** When true, the bat 🦇 in description is clickable and shows an easter egg. */
  easterEgg?: boolean;
  /** Word in tagline that triggers a scary easter egg when clicked (e.g. "sanity"). */
  easterEggTaglineWord?: string;
  /** Word in tagline that opens a link when clicked (e.g. "Ithildin" → YouTube). Optional popupUrl opens in a modal. */
  easterEggLink?: { triggerWord: string; url: string; popupUrl?: string };
  /** When true, render the banner with an animated fire gradient. */
  bannerAnimatedFire?: boolean;
  /** Banner gradient/style: accent (default), fire, cyan, green, purple, orange, rose. */
  bannerStyle?: string;
  /** When true, render the profile as a command window with custom commands. */
  useTerminalLayout?: boolean;
  /** Command window title (e.g. user@slug:~). */
  terminalTitle?: string;
  /** Custom command/output lines for terminal layout. */
  terminalCommands?: { command: string; output: string }[];
  /** When true, render the banner at a smaller font size (e.g. for dense ASCII). */
  bannerSmall?: boolean;
  /** Short tags/pills (e.g. "Vibe Coder", "LOTR"). */
  tags?: string[];
  /** Extra links (GitHub, Twitter, website, etc.). */
  links?: { label: string; href: string }[];
  /** Optional status line (e.g. "Building Ithildin"). */
  status?: string;
  /** Optional quote or fun fact. */
  quote?: string;
  /** Custom OG/social image URL (member profiles only). */
  ogImageUrl?: string;
  /** When set, show "Last updated …" on the profile (member profiles only). */
  updatedAt?: string;
  /** Accent/theme color preset (member profiles only): cyan, green, purple, orange, rose. */
  accentColor?: string;
  /** Terminal prompt character(s) (e.g. $, >, λ, ❯). */
  terminalPrompt?: string;
  /** Short greeting before name (e.g. "hi i'm", "aka"). */
  nameGreeting?: string;
  /** Card style: default, sharp, glass. */
  cardStyle?: string;
  /** User-chosen status indicator (online, idle, busy, offline). Not synced with Discord. */
  displayStatus?: string;
  /** Pronouns (e.g. they/them). */
  pronouns?: string;
  /** Location or "Based in" (e.g. NYC, Berlin). */
  location?: string;
  /** IANA timezone (e.g. America/New_York) for local time display. */
  timezone?: string;
  /** Birthday as MM-DD (month and day only). Shown as countdown to next birthday. */
  birthday?: string;
  /** Avatar shape: circle (default) or rounded. */
  avatarShape?: string;
  /** Layout density: default, compact, spacious. */
  layoutDensity?: string;
  /** When true, ask search engines not to index this profile. */
  noindex?: boolean;
  /** Override meta/OG description for social sharing. */
  metaDescription?: string;
  /** Admin-granted verified badge (member profiles only). */
  verified?: boolean;
  /** Admin-granted staff badge (member profiles only). */
  staff?: boolean;
  /** Discord badge keys to show (when user opted in via showDiscordBadges). */
  discordBadges?: string[];
  /** Gallery: images with optional title and description. */
  gallery?: { id: number; imageUrl: string; title?: string; description?: string; sortOrder: number }[];
}

/** Static profiles removed; use profile templates in the dashboard instead. */
export const PROFILES: Profile[] = [];

export function getProfileBySlug(_slug: string): Profile | undefined {
  return undefined;
}

export function getProfileSlugs(): string[] {
  return [];
}
