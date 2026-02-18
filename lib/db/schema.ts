/**
 * Postgres schema (Drizzle). Run migrations with: npm run db:migrate
 * Users = Discord-linked accounts. Profiles = member pages (1 per user). ProfileViews = page view log.
 */
import { pgTable, text, timestamp, integer, serial, boolean, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  discordUserId: text("discord_user_id").notNull().unique(),
  username: text("username"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  approved: boolean("approved").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  verified: boolean("verified").default(false).notNull(),
  staff: boolean("staff").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description").notNull(),
  avatarUrl: text("avatar_url"),
  status: text("status"),
  quote: text("quote"),
  tags: text("tags").array(),
  discord: text("discord"),
  roblox: text("roblox"),
  banner: text("banner"),
  bannerSmall: boolean("banner_small").default(false),
  bannerAnimatedFire: boolean("banner_animated_fire").default(false),
  bannerStyle: text("banner_style"),
  useTerminalLayout: boolean("use_terminal_layout").default(false),
  terminalTitle: text("terminal_title"),
  terminalCommands: text("terminal_commands"),
  easterEgg: boolean("easter_egg").default(false),
  easterEggTaglineWord: text("easter_egg_tagline_word"),
  easterEggLinkTrigger: text("easter_egg_link_trigger"),
  easterEggLinkUrl: text("easter_egg_link_url"),
  easterEggLinkPopupUrl: text("easter_egg_link_popup_url"),
  links: text("links"),
  ogImageUrl: text("og_image_url"),
  showUpdatedAt: boolean("show_updated_at").default(false),
  accentColor: text("accent_color"),
  terminalPrompt: text("terminal_prompt"),
  nameGreeting: text("name_greeting"),
  cardStyle: text("card_style"),
  displayStatus: text("display_status"),
  pronouns: text("pronouns"),
  location: text("location"),
  timezone: text("timezone"),
  avatarShape: text("avatar_shape"),
  layoutDensity: text("layout_density"),
  noindex: boolean("noindex").default(false),
  metaDescription: text("meta_description"),
  showPageViews: boolean("show_page_views").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profileViews = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  visitorIp: text("visitor_ip").notNull(),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Vouches: logged-in users can vouch for a profile (one vouch per user per profile). */
export const vouches = pgTable(
  "vouches",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("vouches_profile_user_unique").on(t.profileId, t.userId)]
);

/** Gallery: images with optional title/description, one per profile. */
export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ProfileRow = typeof profiles.$inferSelect;
export type NewProfileRow = typeof profiles.$inferInsert;
export type ProfileViewRow = typeof profileViews.$inferSelect;
export type VouchRow = typeof vouches.$inferSelect;
export type GalleryItemRow = typeof galleryItems.$inferSelect;
export type NewGalleryItemRow = typeof galleryItems.$inferInsert;
