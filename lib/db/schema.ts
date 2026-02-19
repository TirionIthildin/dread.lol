/**
 * MongoDB schema types. Collections: users, profiles, profile_views, vouches,
 * gallery_items, profile_short_links, badges, user_badges.
 * Run indexes: npm run db:migrate-prod (or node scripts/migrate.mjs)
 */
import type { ObjectId } from "mongodb";

export interface UserDoc {
  _id: string; // Discord user ID
  discordUserId: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  approved: boolean;
  isAdmin: boolean;
  verified: boolean;
  staff: boolean;
  discordPublicFlags?: number | null;
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
  terminalPrompt?: string | null;
  nameGreeting?: string | null;
  cardStyle?: string | null;
  cardOpacity?: number | null;
  displayStatus?: string | null;
  pronouns?: string | null;
  location?: string | null;
  timezone?: string | null;
  birthday?: string | null;
  avatarShape?: string | null;
  layoutDensity?: string | null;
  noindex?: boolean;
  metaDescription?: string | null;
  showPageViews?: boolean;
  customFont?: string | null;
  customFontUrl?: string | null;
  cursorStyle?: string | null;
  cursorImageUrl?: string | null;
  animationPreset?: string | null;
  backgroundType?: string | null;
  backgroundUrl?: string | null;
  showDiscordBadges?: boolean;
  showDiscordPresence?: boolean;
  showAudioPlayer?: boolean;
  audioTracks?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileViewDoc {
  _id: ObjectId;
  profileId: ObjectId;
  visitorIp: string;
  userAgent?: string | null;
  viewedAt: Date;
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

export type User = UserDoc;
export type NewUser = Omit<UserDoc, "createdAt" | "updatedAt">;
