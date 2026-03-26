import type { CryptoWalletChain } from "@/lib/crypto-widgets";

/**
 * Profile type used on profile pages.
 * Use profile templates in the dashboard and member profiles (DB-backed) for content.
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
  /** Banner gradient/style: accent (default), fire, cyan, green, purple, orange, rose, amber, blue, indigo, teal, sky. */
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
  links?: { label: string; href: string; iconName?: string }[];
  /** When false, link button row omits hover glow on chips. */
  socialLinksGlow?: boolean;
  /** Optional quote or fun fact. */
  quote?: string;
  /** Custom OG/social image URL (member profiles only). */
  ogImageUrl?: string;
  /** @deprecated No longer shown. Kept for type compatibility. */
  updatedAt?: string;
  /** Accent/theme color preset (member profiles only): cyan, green, purple, orange, rose, amber, blue, indigo, teal, sky. Or custom hex (e.g. #ff00ff). */
  accentColor?: string;
  /** Custom text/foreground color (hex). Overrides theme default. */
  customTextColor?: string;
  /** Custom background color (hex). Overrides theme default for page background. */
  customBackgroundColor?: string;
  /** Terminal prompt character(s) (e.g. $, >, λ, ❯). */
  terminalPrompt?: string;
  /** Short greeting before name (e.g. "hi i'm", "aka"). */
  nameGreeting?: string;
  /** Card style: default, sharp, glass, neon, minimal, elevated. */
  cardStyle?: string;
  /** Page theme: classic-dark, classic-light, minimalist-light, minimalist-dark, professional-light, professional-dark. */
  pageTheme?: "classic-dark" | "classic-light" | "minimalist-light" | "minimalist-dark" | "professional-light" | "professional-dark";
  /** Box opacity (50–100). Controls profile card transparency. */
  cardOpacity?: number;
  /** Backdrop blur: none, sm, md, lg. Controls profile card blur. */
  cardBlur?: "none" | "sm" | "md" | "lg";
  /** 3D tilt on hover (card has extra padding so rotation is not clipped). */
  cardEffectTilt?: boolean;
  /** Spotlight gradient that follows the cursor. */
  cardEffectSpotlight?: boolean;
  /** Glare / glossy highlight on hover. */
  cardEffectGlare?: boolean;
  /** Accent border highlight that follows the cursor. */
  cardEffectMagneticBorder?: boolean;
  /** Pronouns (e.g. they/them). */
  pronouns?: string;
  /** Location or "Based in" (e.g. NYC, Berlin). */
  location?: string;
  /** IANA timezone (e.g. America/New_York) for local time display. */
  timezone?: string;
  /** Human-readable availability window (e.g. "Usually 6pm–12am EST"). */
  timezoneRange?: string;
  /** Birthday as MM-DD (month and day only). Shown as countdown to next birthday. */
  birthday?: string;
  /** Primary portfolio/website URL, surfaced separately from generic links. */
  websiteUrl?: string;
  /** When true, non-http(s) link values show as copy buttons; URLs still open in a new tab. */
  copyableSocials?: boolean;
  /** Structured skills/roles (e.g. Frontend, Design, 3D). */
  skills?: string[];
  /** Languages spoken (e.g. "EN, ES, FR"). */
  languages?: string;
  /** Availability/looking-for (e.g. Open to work, Open to collab, Just vibing). */
  availability?: string;
  /** Manual status (e.g. "Working on X") in addition to Discord presence. */
  currentFocus?: string;
  /** Premium: commissions availability. */
  commissionStatus?: "open" | "closed" | "waitlist";
  /** Premium: short free-text price hint (e.g. starting range). */
  commissionPriceRange?: string;
  /** Avatar shape: circle (default), rounded, square, soft, hexagon. */
  avatarShape?: string;
  /** Layout density: default, compact, spacious. */
  layoutDensity?: string;
  /** Custom font key (default, jetbrains-mono, fira-code, space-mono, custom) or URL when custom. */
  customFont?: string;
  /** Custom font file URL when customFont is "custom". */
  customFontUrl?: string;
  /** Cursor style when viewing profile: default, crosshair, pointer, text, grab, minimal, beam, custom. */
  cursorStyle?: string;
  /** Custom cursor image URL when cursorStyle is "custom". */
  cursorImageUrl?: string;
  /** Animation preset: none, fade-in, slide-up, scale-in, glow, shimmer. */
  animationPreset?: string;
  /** Per-field animations: none, typewriter, fade-in, slide-up, slide-in-left, blur-in. */
  nameAnimation?: string;
  taglineAnimation?: string;
  descriptionAnimation?: string;
  /** Background type: none, image, video (visual only; audio is separate). */
  backgroundType?: string;
  /** Background URL (image or video). */
  backgroundUrl?: string;
  /** Ambient background audio URL (separate from visual background). */
  backgroundAudioUrl?: string;
  /** Start playback at this offset in seconds (skips intro). */
  backgroundAudioStartSeconds?: number;
  /** Background overlay effect: snow, rain, blur, retro-computer. */
  backgroundEffect?: string;
  /** Custom text for the unlock overlay when profile has video or audio (default: "Click here to view profile"). */
  unlockOverlayText?: string;
  /** When true, ask search engines not to index this profile. */
  noindex?: boolean;
  /** Override meta/OG description for social sharing. */
  metaDescription?: string;
  /** When true, show view count on profile (member profiles only). */
  showPageViews?: boolean;
  /** View count to display when showPageViews is true. */
  viewCount?: number;
  /** Admin-granted verified badge (member profiles only). */
  verified?: boolean;
  /** Admin-granted Verified Creator (member profiles only). */
  verifiedCreator?: boolean;
  /** Admin-granted staff badge (member profiles only). */
  staff?: boolean;
  /** Dread Premium badge (subscription, one-time, or admin-granted). */
  premium?: boolean;
  /** Custom badges (admin-created and assigned). */
  customBadges?: {
    id: string;
    key: string;
    label: string;
    description?: string;
    color?: string;
    sortOrder: number;
    badgeType?: string;
    imageUrl?: string;
    iconName?: string;
  }[];
  /** Discord badge keys to show (when user opted in via showDiscordBadges). */
  discordBadges?: string[];
  /** Resolved Discord avatar decoration image URL (CDN); only when using Discord avatar and opted in. */
  discordAvatarDecoration?: string;
  /** Gallery: images with optional title and description. */
  gallery?: { id: string; imageUrl: string; title?: string; description?: string; sortOrder: number }[];
  /** Live Discord status + Rich Presence (from presence bot). */
  discordPresence?: {
    status: "online" | "idle" | "dnd" | "offline";
    activities: { name: string; type?: number; state?: string | null; details?: string | null }[];
  };
  /** How to display Discord presence: pills (default), minimal, stacked, inline. */
  discordPresenceStyle?: string;
  /** Last seen in Discord (ISO string), when offline or no presence. */
  discordLastSeen?: string;
  /** When true, show an audio player widget on the profile. */
  showAudioPlayer?: boolean;
  /** Audio visualizer style: none, bars, waveform, circle, line, blocks. */
  audioVisualizerStyle?: string;
  /** Audio visualizer animation: default, smooth, bounce, glow, pulse. */
  audioVisualizerAnimation?: string;
  /** Audio tracks for the player: url and optional title. */
  audioTracks?: { url: string; title?: string }[];
  /** Roblox widgets (requires OAuth link): accountAge, profile. */
  robloxWidgets?: {
    accountAge?: { createdAt: Date; label: string };
    profile?: { url: string; displayName: string; username: string };
  };
  /** When true, widgets use profile accent color instead of brand colors. */
  widgetsMatchAccent?: boolean;
  /** Comma-separated Discord widget order (e.g. "accountAge,joined,serverCount,serverInvite"). Determines display order. */
  showDiscordWidgets?: string;
  /** Comma-separated Roblox widget order (e.g. "accountAge,profile"). Determines display order. */
  showRobloxWidgets?: string;
  /** @deprecated Replaced by crypto wallet fields. */
  showCryptoWidgets?: string;
  /** @deprecated Prefer per-network fields. */
  cryptoWalletChain?: string;
  /** @deprecated Prefer per-network fields. */
  cryptoWalletAddress?: string;
  cryptoWalletEthereum?: string;
  cryptoWalletBitcoin?: string;
  cryptoWalletSolana?: string;
  /** Comma-separated GitHub widget keys (lastPush, publicRepos, contributions, profile). */
  showGithubWidgets?: string;
  /** Fetched GitHub stats (merged on profile page, not stored in DB). */
  githubWidgets?: {
    login: string;
    profileUrl: string;
    avatarUrl?: string;
    lastPush?: { at: string; repoName?: string };
    publicRepos?: number;
    contributions?: { total: number; heatmap: number[][] };
    contributionsUnavailable?: boolean;
  };
  /** Fetched wallet balances (merged on profile page, not stored in DB). */
  cryptoWidgets?: {
    wallets: Array<{
      chain: CryptoWalletChain;
      networkLabel: string;
      symbol: string;
      address: string;
      addressShort: string;
      balanceNative: number;
      balanceUsd: number | null;
    }>;
  };
  /** Discord widgets to show: accountAge, joined, serverCount, serverInvite. */
  discordWidgets?: {
    accountAge?: { createdAt: Date; label: string };
    joined?: { createdAt: Date; label: string };
    serverCount?: number;
    serverInvite?: { url: string; guildName?: string; memberCount?: number };
  };
  /** Ordered section IDs for drag-and-drop layout. When absent, uses default order. */
  sectionOrder?: string[];
  /** Per-section visibility. When true, section is hidden. Default: visible. */
  sectionVisibility?: Record<string, boolean>;
  /** Section IDs explicitly removed from profile (excluded from display). */
  removedSectionIds?: string[];
}

/** Resolve per-effect card flags from DB or template. Legacy `cardEffectsEnabled` applies to all four when no new flags are stored. */
export function resolveCardEffects(row: {
  cardEffectsEnabled?: boolean | null;
  cardEffectTilt?: boolean | null;
  cardEffectSpotlight?: boolean | null;
  cardEffectGlare?: boolean | null;
  cardEffectMagneticBorder?: boolean | null;
}): {
  cardEffectTilt: boolean;
  cardEffectSpotlight: boolean;
  cardEffectGlare: boolean;
  cardEffectMagneticBorder: boolean;
} {
  const legacy = row.cardEffectsEnabled ?? false;
  const anyNew =
    row.cardEffectTilt != null ||
    row.cardEffectSpotlight != null ||
    row.cardEffectGlare != null ||
    row.cardEffectMagneticBorder != null;
  if (!anyNew) {
    return {
      cardEffectTilt: legacy,
      cardEffectSpotlight: legacy,
      cardEffectGlare: legacy,
      cardEffectMagneticBorder: legacy,
    };
  }
  return {
    cardEffectTilt: Boolean(row.cardEffectTilt),
    cardEffectSpotlight: Boolean(row.cardEffectSpotlight),
    cardEffectGlare: Boolean(row.cardEffectGlare),
    cardEffectMagneticBorder: Boolean(row.cardEffectMagneticBorder),
  };
}

