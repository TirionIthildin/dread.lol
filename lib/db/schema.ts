/**
 * MongoDB schema types. Collections: users, profiles, profile_views, vouches,
 * gallery_items, profile_short_links, badges, user_badges.
 * Run indexes: npm run db:migrate-prod (or node scripts/migrate.mjs)
 */
import type { Binary, ObjectId } from "mongodb";

export interface UserDoc {
  /** Discord snowflake, or `local:<uuid>` for passwordless/local auth accounts. */
  _id: string;
  /** Set for Discord OAuth users; omitted for local auth users (sparse unique index). */
  discordUserId?: string;
  /** `discord` (default) or `local` for username/email/SRP/WebAuthn accounts. */
  authProvider?: "discord" | "local";
  /** Normalized email for local accounts; verification gate for enrollment. */
  email?: string | null;
  emailVerifiedAt?: Date | null;
  /** SRP-6a salt (hex) and verifier (hex); optional if passkey-only. */
  srpSalt?: string | null;
  srpVerifier?: string | null;
  /** TOTP 2FA (optional). */
  totpEnabled?: boolean;
  /** AES-256-GCM encrypted TOTP secret (base64). */
  totpSecretEnc?: string | null;
  /** scrypt hashes of one-time backup codes (salt+hash base64 each). */
  totpBackupCodesHash?: string[] | null;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  approved: boolean;
  isAdmin: boolean;
  verified: boolean;
  staff: boolean;
  /** Admin-granted free Premium (bypasses Polar payment). */
  premiumGranted?: boolean;
  /** Admin-granted Verified Creator: Premium + profile pill + creator badge program. */
  verifiedCreator?: boolean;
  /** Admin-granted custom badge slots (vouchers). Adds to purchased count. */
  customBadgeVouchers?: number;
  /** Profile restricted: billing issue or terminated. When true, profile shows restricted message. */
  restricted?: boolean;
  discordPublicFlags?: number | null;
  /** 0=None, 1=Nitro Classic, 2=Nitro, 3=Nitro Basic */
  discordPremiumType?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileDoc {
  _id: ObjectId;
  userId: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description: string;
  avatarUrl?: string | null;
  status?: string | null;
  quote?: string | null;
  tags?: string[] | null;
  discord?: string | null;
  roblox?: string | null;
  banner?: string | null;
  bannerSmall?: boolean;
  bannerAnimatedFire?: boolean;
  bannerStyle?: string | null;
  useTerminalLayout?: boolean;
  terminalTitle?: string | null;
  terminalCommands?: string | null;
  easterEgg?: boolean;
  easterEggTaglineWord?: string | null;
  easterEggLinkTrigger?: string | null;
  easterEggLinkUrl?: string | null;
  easterEggLinkPopupUrl?: string | null;
  links?: string | null;
  ogImageUrl?: string | null;
  showUpdatedAt?: boolean;
  accentColor?: string | null;
  customTextColor?: string | null;
  customBackgroundColor?: string | null;
  terminalPrompt?: string | null;
  nameGreeting?: string | null;
  cardStyle?: string | null;
  cardOpacity?: number | null;
  /** Backdrop blur: none, sm, md, lg. */
  cardBlur?: "none" | "sm" | "md" | "lg" | null;
  /** @deprecated Prefer cardEffectTilt/Spotlight/Glare/MagneticBorder. If any new flag is set, legacy is ignored. */
  cardEffectsEnabled?: boolean | null;
  /** 3D tilt on hover. */
  cardEffectTilt?: boolean | null;
  /** Spotlight gradient following cursor. */
  cardEffectSpotlight?: boolean | null;
  /** Glare / glossy highlight following cursor. */
  cardEffectGlare?: boolean | null;
  /** Accent border glow following cursor. */
  cardEffectMagneticBorder?: boolean | null;
  displayStatus?: string | null;
  pronouns?: string | null;
  location?: string | null;
  timezone?: string | null;
  /** Human-readable availability window, e.g. "Usually 6pm–12am EST". */
  timezoneRange?: string | null;
  birthday?: string | null;
  avatarShape?: string | null;
  /** Primary portfolio/website URL, surfaced separately from generic links. */
  websiteUrl?: string | null;
  /** Structured skills/roles, e.g. ["Frontend", "Design", "3D"]. */
  skills?: string[] | null;
  /** Languages spoken, e.g. "EN, ES, FR". */
  languages?: string | null;
  /** Availability/looking-for, e.g. "Open to work", "Open to collab", "Just vibing". */
  availability?: string | null;
  /** Manual status, e.g. "Working on X", "Taking a break" (in addition to Discord presence). */
  currentFocus?: string | null;
  /** Premium: commissions open / closed / waitlist. */
  commissionStatus?: "open" | "closed" | "waitlist" | null;
  /** Premium: short text, e.g. starting price range. */
  commissionPriceRange?: string | null;
  layoutDensity?: string | null;
  noindex?: boolean;
  metaDescription?: string | null;
  showPageViews?: boolean;
  customFont?: string | null;
  customFontUrl?: string | null;
  cursorStyle?: string | null;
  cursorImageUrl?: string | null;
  animationPreset?: string | null;
  nameAnimation?: string | null;
  taglineAnimation?: string | null;
  descriptionAnimation?: string | null;
  backgroundType?: string | null;
  backgroundUrl?: string | null;
  backgroundAudioUrl?: string | null;
  /** Start playback at this offset (seconds). Skips intro/silence. */
  backgroundAudioStartSeconds?: number | null;
  /** Background overlay effect: snow, rain, blur, retro-computer. */
  backgroundEffect?: string | null;
  /** Custom text for unlock overlay (video/audio); default "Click here to view profile". */
  unlockOverlayText?: string | null;
  showDiscordBadges?: boolean;
  /** Comma-separated Discord badge keys to hide on profile (e.g. Nitro,NitroClassic). */
  hiddenDiscordBadges?: string | null;
  showDiscordPresence?: boolean;
  /** Discord presence display style: pills, minimal, stacked, inline. */
  discordPresenceStyle?: string | null;
  /** Discord widgets to show: comma-separated accountAge,serverCount,serverInvite. */
  showDiscordWidgets?: string | null;
  /** User's Discord server invite URL or code (for server invite widget). */
  discordInviteUrl?: string | null;
  /** Roblox widgets to show: comma-separated accountAge,profile (requires OAuth link). */
  showRobloxWidgets?: string | null;
  /** Comma-separated CoinGecko coin ids for spot price widget (max 6, allowlisted). */
  showCryptoWidgets?: string | null;
  /** GitHub username for widget cards (public API). */
  githubUsername?: string | null;
  /** Comma-separated: lastPush, publicRepos, contributions (max 3; counts toward widget cap with Discord/Roblox). */
  showGithubWidgets?: string | null;
  /** When true, widgets use profile accent color instead of brand colors. */
  widgetsMatchAccent?: boolean | null;
  showAudioPlayer?: boolean;
  /** Audio visualizer style: none, bars, waveform, circle, line, blocks */
  audioVisualizerStyle?: string | null;
  /** Audio visualizer animation: default, smooth, bounce, glow, pulse */
  audioVisualizerAnimation?: string | null;
  audioTracks?: string | null;
  /** Page theme: classic-dark, classic-light, minimalist-light, minimalist-dark, professional-light, professional-dark. */
  pageTheme?: "classic-dark" | "classic-light" | "minimalist-light" | "minimalist-dark" | "professional-light" | "professional-dark" | null;
  /** Ordered section IDs for drag-and-drop layout. When absent, uses default order. */
  sectionOrder?: string[] | null;
  /** Per-section visibility. When true, section is hidden. Default: visible. */
  sectionVisibility?: Record<string, boolean> | null;
  /** Section IDs explicitly removed from the profile. Can be re-added via element picker. */
  removedSectionIds?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileViewDoc {
  _id: ObjectId;
  profileId: ObjectId;
  visitorIp: string;
  userAgent?: string | null;
  /** Hash of IP+UA for unique view counting. New records only. */
  visitorKey?: string | null;
  viewedAt: Date;
  /** Logged-in viewer's Discord user ID (for "who viewed" analytics). */
  viewerUserId?: string | null;
  /** Full Referer URL. */
  referrer?: string | null;
  /** Parsed domain for traffic source (e.g. "google.com", "discord.com"). */
  referrerDomain?: string | null;
  /** Parsed from user agent: desktop, mobile, bot, unknown. */
  deviceType?: "desktop" | "mobile" | "bot" | "unknown" | null;
  /** Country code from Cloudflare CF-IPCountry (ISO 3166-1 Alpha 2). */
  countryCode?: string | null;
}

export interface VouchDoc {
  _id: ObjectId;
  profileId: ObjectId;
  userId: string;
  createdAt: Date;
}

export interface GalleryItemDoc {
  _id: ObjectId;
  profileId: ObjectId;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  sortOrder: number;
}

export interface ProfileShortLinkDoc {
  _id: ObjectId;
  profileId: ObjectId;
  slug: string;
  url: string;
}

export interface BadgeDoc {
  _id: ObjectId;
  key: string;
  label: string;
  description?: string | null;
  color?: string | null;
  sortOrder: number;
  badgeType?: string | null;
  imageUrl?: string | null;
  iconName?: string | null;
}

export interface UserBadgeDoc {
  _id: ObjectId;
  userId: string;
  badgeId: ObjectId;
}

/** User-designed badge (custom badge addon or Verified Creator program). */
export interface UserCreatedBadgeDoc {
  _id: ObjectId;
  userId: string;
  label: string;
  description?: string | null;
  color?: string | null;
  badgeType?: string | null;
  imageUrl?: string | null;
  iconName?: string | null;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
  /** Single free badge from Verified Creator program (not purchased slots). */
  creatorProgram?: boolean;
}

export interface BlogPostDoc {
  _id: ObjectId;
  profileId: ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/** ProfileRow: API-facing shape with string id (from _id.toString()) */
export type ProfileRow = Omit<ProfileDoc, "_id"> & { id: string };
export type NewProfileRow = Omit<ProfileRow, "createdAt" | "updatedAt">;

export type ProfileViewRow = Omit<ProfileViewDoc, "_id" | "profileId"> & {
  id: string;
  profileId: string;
  viewedAt: Date;
};

export type VouchRow = Omit<VouchDoc, "_id" | "profileId"> & { id: string; profileId: string };
export type GalleryItemRow = Omit<GalleryItemDoc, "_id" | "profileId"> & {
  id: string;
  profileId: string;
};
export type ProfileShortLinkRow = Omit<ProfileShortLinkDoc, "_id" | "profileId"> & {
  id: string;
  profileId: string;
};
export type BadgeRow = Omit<BadgeDoc, "_id"> & { id: string };
export type UserBadgeRow = Omit<UserBadgeDoc, "_id" | "badgeId"> & { id: string; badgeId: string };

export interface BlogPostRow {
  id: string;
  profileId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Polar subscription synced from webhooks or Customer State API fallback. */
export interface PolarSubscriptionDoc {
  _id?: ObjectId;
  polarSubscriptionId: string;
  polarCustomerId: string;
  userId: string; // Discord user ID (Polar external_id)
  productId: string;
  productName?: string | null;
  status: "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
  endedAt?: Date | null;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Polar order synced from webhooks or Orders API fallback. */
export interface PolarOrderDoc {
  _id?: ObjectId;
  polarOrderId: string;
  polarCustomerId: string;
  userId: string; // Discord user ID (Polar external_id)
  productId: string;
  productName?: string | null;
  amount: number; // cents
  currency: string;
  status: "pending" | "paid" | "refunded" | "canceled";
  paidAt?: Date | null;
  refundedAt?: Date | null;
  canceledAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Link to redeem a user-created badge. Supports single-use (legacy) or multi-use with optional cap and expiry. */
export interface BadgeRedemptionLinkDoc {
  _id: ObjectId;
  token: string;
  badgeId: ObjectId; // user_created_badges._id
  createdBy: string; // userId (Discord ID)
  usedAt: Date | null; // legacy single-use
  usedBy: string | null; // legacy single-use
  /** null = unlimited. Multi-use links ignore usedAt/usedBy. */
  maxRedemptions?: number | null;
  /** Atomic counter used for capped multi-use links. */
  redemptionCount?: number;
  /** Optional expiry. */
  expiresAt?: Date | null;
  createdAt: Date;
}

/** Per-user redemption event. Prevents duplicate redemptions and provides audit trail. */
export interface BadgeRedemptionEventDoc {
  _id: ObjectId;
  linkId: ObjectId;
  token: string;
  redeemedBy: string;
  redeemedAt: Date;
}

/** Shareable link for Premium voucher. Admin or verified creator creates; tied to creator for attribution. */
export interface PremiumVoucherLinkDoc {
  _id: ObjectId;
  token: string;
  createdBy: string; // creator userId
  createdAt: Date;
  expiresAt?: Date | null;
  maxRedemptions?: number | null;
  /** Atomic counter used for capped links. */
  redemptionCount?: number;
  label?: string | null;
}

/** Logs each Premium voucher redemption for creator attribution. */
export interface PremiumVoucherRedemptionDoc {
  _id: ObjectId;
  linkId: ObjectId;
  token: string;
  redeemedBy: string;
  creatorId: string;
  redeemedAt: Date;
  /** True until premiumGranted is successfully applied to the user record. */
  grantPending?: boolean;
  /** Set when grantPending transitions to false. */
  grantedAt?: Date;
}

/** WebAuthn credential for local auth users (passkeys). */
export interface WebAuthnCredentialDoc {
  _id: ObjectId;
  userId: string;
  credentialId: string;
  publicKey: Binary | Buffer;
  counter: number;
  transports?: string[] | null;
  createdAt: Date;
}

export type User = UserDoc;
export type NewUser = Omit<UserDoc, "createdAt" | "updatedAt">;
