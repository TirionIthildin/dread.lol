/**
 * Member profiles (DB-backed): one profile per user, view tracking, basic edit.
 * Static profiles remain in lib/profiles.ts and are not listed in the dashboard.
 */
import { eq, and, desc, or, ilike, sql } from "drizzle-orm";
import { db, users, profiles, profileViews, vouches, galleryItems } from "@/lib/db";
import type { Profile } from "@/lib/profiles";
import type { ProfileRow, ProfileViewRow } from "@/lib/db/schema";
import type { SessionUser } from "@/lib/auth/session";

export interface MemberProfileWithViews {
  profile: ProfileRow;
  viewCount: number;
  recentViews: { visitorIp: string; viewedAt: Date; userAgent: string | null }[];
}

export interface UserWithApproval {
  id: string;
  approved: boolean;
  isAdmin: boolean;
}

/** Hardcoded admin Discord user IDs. */
const ADMIN_DISCORD_IDS = [
  "1434358894586761246",
  "712435421518233600",
  "817182958460207104",
];

function getAdminDiscordIds(): string[] {
  return ADMIN_DISCORD_IDS;
}

/** Get or create user by Discord id (session.sub). New users are created with approved: false. Refreshes name and avatar on each login. */
export async function getOrCreateUser(session: SessionUser): Promise<UserWithApproval> {
  const id = session.sub;
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (existing) {
    if (
      existing.displayName !== session.name ||
      existing.username !== session.preferred_username ||
      existing.avatarUrl !== session.picture
    ) {
      await db
        .update(users)
        .set({
          displayName: session.name ?? null,
          username: session.preferred_username ?? null,
          avatarUrl: session.picture ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));
    }
    return {
      id: existing.id,
      approved: existing.approved,
      isAdmin: existing.isAdmin || getAdminDiscordIds().includes(existing.discordUserId),
    };
  }
  await db.insert(users).values({
    id,
    discordUserId: session.sub,
    username: session.preferred_username ?? undefined,
    displayName: session.name ?? undefined,
    avatarUrl: session.picture ?? undefined,
    approved: false,
    isAdmin: false,
  });
  return { id, approved: false, isAdmin: getAdminDiscordIds().includes(session.sub) };
}

const PENDING_USER_SELECT = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  avatarUrl: users.avatarUrl,
  createdAt: users.createdAt,
} as const;

export type PendingUserRow = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

/** List users that are not yet approved (for admin panel). */
export async function getPendingUsersList(): Promise<PendingUserRow[]> {
  const rows = await db
    .select(PENDING_USER_SELECT)
    .from(users)
    .where(eq(users.approved, false))
    .orderBy(desc(users.createdAt));
  return rows;
}

/** List pending users with optional search and pagination. */
export async function getPendingUsersListPaginated(options: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: PendingUserRow[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const offset = (page - 1) * limit;
  const search = options.search?.trim();

  const baseWhere = eq(users.approved, false);
  const searchWhere = search
    ? or(
        ilike(users.username, `%${search}%`),
        ilike(users.displayName, `%${search}%`),
        ilike(users.id, `%${search}%`)
      )
    : undefined;
  const whereClause = searchWhere ? and(baseWhere, searchWhere) : baseWhere;

  const [items, countResult] = await Promise.all([
    db
      .select(PENDING_USER_SELECT)
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { items, total, page, limit, totalPages };
}

/** Approve a user by id. Caller must be admin. */
export async function approveUser(userId: string): Promise<boolean> {
  const [row] = await db.update(users).set({ approved: true, updatedAt: new Date() }).where(eq(users.id, userId)).returning({ id: users.id });
  return Boolean(row);
}

/** Get verified/staff badges for a user. */
export async function getUserBadges(userId: string): Promise<{ verified: boolean; staff: boolean }> {
  const [row] = await db.select({ verified: users.verified, staff: users.staff }).from(users).where(eq(users.id, userId)).limit(1);
  if (!row) return { verified: false, staff: false };
  return { verified: row.verified, staff: row.staff };
}

/** Get Discord public_flags (badge bitfield) for a user. Returns null if column not migrated. */
export async function getUserDiscordFlags(_userId: string): Promise<number | null> {
  return null;
}

/** Set verified/staff badges. Caller must be admin. */
export async function setUserBadges(
  userId: string,
  badges: { verified?: boolean; staff?: boolean }
): Promise<boolean> {
  const updates: Partial<{ verified: boolean; staff: boolean; updatedAt: Date }> = { updatedAt: new Date() };
  if (typeof badges.verified === "boolean") updates.verified = badges.verified;
  if (typeof badges.staff === "boolean") updates.staff = badges.staff;
  if (Object.keys(updates).length <= 1) return true;
  const [row] = await db.update(users).set(updates).where(eq(users.id, userId)).returning({ id: users.id });
  return Boolean(row);
}

const ADMIN_USER_SELECT = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  avatarUrl: users.avatarUrl,
  approved: users.approved,
  verified: users.verified,
  staff: users.staff,
  createdAt: users.createdAt,
} as const;

export type AdminUserRow = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  approved: boolean;
  verified: boolean;
  staff: boolean;
  createdAt: Date;
};

/** List all users for admin (id, username, displayName, avatarUrl, approved, verified, staff, createdAt). */
export async function getUsersForAdminList(): Promise<AdminUserRow[]> {
  const rows = await db
    .select(ADMIN_USER_SELECT)
    .from(users)
    .orderBy(desc(users.createdAt));
  return rows;
}

/** List users for admin with optional search (username, displayName, id). */
export async function getUsersForAdminListSearch(search?: string): Promise<AdminUserRow[]> {
  const q = search?.trim();
  const baseOrder = desc(users.createdAt);
  if (!q) {
    return db.select(ADMIN_USER_SELECT).from(users).orderBy(baseOrder);
  }
  const searchWhere = or(
    ilike(users.username, `%${q}%`),
    ilike(users.displayName, `%${q}%`),
    ilike(users.id, `%${q}%`)
  );
  return db
    .select(ADMIN_USER_SELECT)
    .from(users)
    .where(searchWhere)
    .orderBy(baseOrder);
}

/** Get or create the member's single profile. If slug is taken, appends a short suffix. */
export async function getOrCreateMemberProfile(
  userId: string,
  defaults: { name: string; slug: string; avatarUrl?: string }
): Promise<ProfileRow> {
  const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (existing) return existing;
  let slug = defaults.slug;
  for (let i = 0; i < 10; i++) {
    try {
      const [row] = await db
        .insert(profiles)
        .values({
          userId,
          slug: slug || "member",
          name: defaults.name,
          description: "",
          avatarUrl: defaults.avatarUrl ?? null,
        })
        .returning();
      if (!row) throw new Error("Failed to create profile");
      return row;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("unique") && msg.includes("slug") && i < 9) {
        slug = `${defaults.slug}-${userId.slice(-8)}`;
      } else {
        throw err;
      }
    }
  }
  throw new Error("Failed to create profile: slug conflict");
}

/** Get member profile by slug (for public page). Returns null if not found. */
export async function getMemberProfileBySlug(slug: string): Promise<ProfileRow | null> {
  const [row] = await db.select().from(profiles).where(eq(profiles.slug, slug)).limit(1);
  return row ?? null;
}

/** Get member profile by id. Returns null if not found. Used for ownership checks. */
export async function getMemberProfileById(profileId: number): Promise<ProfileRow | null> {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  return row ?? null;
}

/** Get profile slug for a user (for revalidation). Returns null if no profile. */
export async function getProfileSlugByUserId(userId: string): Promise<string | null> {
  const [row] = await db.select({ slug: profiles.slug }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return row?.slug ?? null;
}

/** Get all member profile slugs (e.g. for sitemap). */
export async function getAllMemberProfileSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: profiles.slug }).from(profiles);
  return rows.map((r) => r.slug);
}

export interface VouchedByUser {
  userId: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

/** Get vouch count and list of users who vouched for a profile. Returns empty if vouches table does not exist. */
export async function getVouchesForProfile(profileId: number): Promise<{
  count: number;
  vouchedBy: VouchedByUser[];
}> {
  try {
    const rows = await db
      .select({
        userId: vouches.userId,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(vouches)
      .innerJoin(users, eq(vouches.userId, users.id))
      .where(eq(vouches.profileId, profileId))
      .orderBy(desc(vouches.createdAt));
    return { count: rows.length, vouchedBy: rows };
  } catch (err) {
    if (isRelationNotFound(err)) return { count: 0, vouchedBy: [] };
    throw err;
  }
}

/** Add a vouch from a user for a profile. Returns true if added, false if already vouched or self-vouch. */
export async function addVouch(profileId: number, userId: string): Promise<boolean> {
  const [profile] = await db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.id, profileId)).limit(1);
  if (!profile || profile.userId === userId) return false;
  try {
    await db.insert(vouches).values({ profileId, userId });
    return true;
  } catch (err) {
    if (isRelationNotFound(err)) return false;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) return false;
    throw err;
  }
}

/** Remove a vouch. Returns true if removed. */
export async function removeVouch(profileId: number, userId: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(vouches)
      .where(and(eq(vouches.profileId, profileId), eq(vouches.userId, userId)))
      .returning({ id: vouches.id });
    return deleted.length > 0;
  } catch (err) {
    if (isRelationNotFound(err)) return false;
    throw err;
  }
}

/** Check if a user has vouched for a profile. Returns false if vouches table does not exist. */
export async function hasUserVouched(profileId: number, userId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: vouches.id })
      .from(vouches)
      .where(and(eq(vouches.profileId, profileId), eq(vouches.userId, userId)))
      .limit(1);
    return Boolean(row);
  } catch (err) {
    if (isRelationNotFound(err)) return false;
    throw err;
  }
}

/** Record a page view for a member profile. */
export async function recordProfileView(
  profileId: number,
  visitorIp: string,
  userAgent?: string | null
): Promise<void> {
  await db.insert(profileViews).values({
    profileId,
    visitorIp,
    userAgent: userAgent ?? null,
  });
}

/** Get view count and recent views for a profile. */
export async function getProfileViews(
  profileId: number,
  recentLimit = 50
): Promise<{ viewCount: number; recentViews: ProfileViewRow[] }> {
  const all = await db
    .select()
    .from(profileViews)
    .where(eq(profileViews.profileId, profileId))
    .orderBy(desc(profileViews.viewedAt));
  const viewCount = all.length;
  const recentViews = all.slice(0, recentLimit);
  return { viewCount, recentViews };
}

/** Update member profile. Caller must ensure profile belongs to user. */
export async function updateMemberProfile(
  profileId: number,
  userId: string,
  data: {
    slug?: string;
    name?: string;
    tagline?: string;
    description?: string;
    avatarUrl?: string;
    status?: string;
    quote?: string;
    tags?: string[] | null;
    discord?: string;
    roblox?: string;
    banner?: string;
    bannerSmall?: boolean;
    bannerAnimatedFire?: boolean;
    bannerStyle?: string;
    useTerminalLayout?: boolean;
    terminalTitle?: string;
    terminalCommands?: string | null;
    easterEgg?: boolean;
    easterEggTaglineWord?: string;
    easterEggLinkTrigger?: string;
    easterEggLinkUrl?: string;
    easterEggLinkPopupUrl?: string;
    links?: string | null;
    ogImageUrl?: string;
    showUpdatedAt?: boolean;
    accentColor?: string;
    terminalPrompt?: string;
    nameGreeting?: string;
    cardStyle?: string;
    displayStatus?: string;
    pronouns?: string;
    location?: string;
    timezone?: string;
    avatarShape?: string;
    layoutDensity?: string;
    noindex?: boolean;
    metaDescription?: string;
    showPageViews?: boolean;
  }
): Promise<ProfileRow> {
  const [row] = await db
    .update(profiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .returning();
  if (!row) throw new Error("Profile not found or access denied");
  return row;
}

function parseLinks(raw: string | null): { label: string; href: string }[] | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return undefined;
    return arr.filter(
      (x): x is { label: string; href: string } =>
        x && typeof x === "object" && typeof (x as { label?: string }).label === "string" && typeof (x as { href?: string }).href === "string"
    );
  } catch {
    return undefined;
  }
}

function parseTerminalCommands(raw: string | null): { command: string; output: string }[] | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return undefined;
    return arr
      .filter(
        (x): x is { command: string; output: string } =>
          x && typeof x === "object" && typeof (x as { command?: string }).command === "string" && typeof (x as { output?: string }).output === "string"
      )
      .map((x) => ({ command: x.command, output: x.output }));
  } catch {
    return undefined;
  }
}

function formatUpdatedAt(d: Date): string {
  return new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
}

/** Convert DB profile row to the Profile shape used by ProfileContent. */
export function memberProfileToProfile(
  row: ProfileRow,
  badges?: { verified: boolean; staff: boolean },
  _discordPublicFlags?: number | null
): Profile {
  const links = parseLinks(row.links);
  const easterEggLink =
    row.easterEggLinkTrigger && row.easterEggLinkUrl
      ? {
          triggerWord: row.easterEggLinkTrigger,
          url: row.easterEggLinkUrl,
          popupUrl: row.easterEggLinkPopupUrl ?? undefined,
        }
      : undefined;
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? undefined,
    description: row.description,
    avatar: row.avatarUrl ?? undefined,
    status: row.status ?? undefined,
    quote: row.quote ?? undefined,
    tags: row.tags ?? undefined,
    discord: row.discord ?? undefined,
    roblox: row.roblox ?? undefined,
    banner: row.banner ?? undefined,
    bannerSmall: row.bannerSmall ?? undefined,
    bannerAnimatedFire: row.bannerAnimatedFire ?? undefined,
    bannerStyle: row.bannerAnimatedFire && !row.bannerStyle ? "fire" : (row.bannerStyle ?? undefined),
    useTerminalLayout: row.useTerminalLayout ?? undefined,
    terminalTitle: row.terminalTitle ?? undefined,
    terminalCommands: parseTerminalCommands(row.terminalCommands),
    easterEgg: row.easterEgg ?? undefined,
    easterEggTaglineWord: row.easterEggTaglineWord ?? undefined,
    easterEggLink,
    links,
    ogImageUrl: row.ogImageUrl ?? undefined,
    updatedAt: row.showUpdatedAt && row.updatedAt ? formatUpdatedAt(row.updatedAt) : undefined,
    accentColor: row.accentColor ?? undefined,
    terminalPrompt: row.terminalPrompt ?? undefined,
    nameGreeting: row.nameGreeting ?? undefined,
    cardStyle: row.cardStyle ?? undefined,
    displayStatus: row.displayStatus ?? undefined,
    pronouns: row.pronouns ?? undefined,
    location: row.location ?? undefined,
    timezone: row.timezone ?? undefined,
    avatarShape: row.avatarShape ?? undefined,
    layoutDensity: row.layoutDensity ?? undefined,
    noindex: row.noindex ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    ...(badges && {
      verified: badges.verified || undefined,
      staff: badges.staff || undefined,
    }),
  };
}

/** Gallery item for profile display. */
export interface GalleryItem {
  id: number;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  sortOrder: number;
}

/** True if the error is Postgres "relation does not exist" (e.g. gallery_items not migrated). */
function isRelationNotFound(err: unknown): boolean {
  const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
  return code === "42P01";
}

/** Get gallery items for a profile, ordered by sortOrder then id. Returns [] if gallery_items table does not exist. */
export async function getGalleryForProfile(profileId: number): Promise<GalleryItem[]> {
  try {
    const rows = await db
      .select({
        id: galleryItems.id,
        imageUrl: galleryItems.imageUrl,
        title: galleryItems.title,
        description: galleryItems.description,
        sortOrder: galleryItems.sortOrder,
      })
      .from(galleryItems)
      .where(eq(galleryItems.profileId, profileId))
      .orderBy(galleryItems.sortOrder, galleryItems.id);
    return rows.map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl,
      title: r.title ?? undefined,
      description: r.description ?? undefined,
      sortOrder: r.sortOrder,
    }));
  } catch (err) {
    if (isRelationNotFound(err)) return [];
    throw err;
  }
}

/** Ensure profile belongs to userId; throw if not. */
async function ensureProfileOwnership(profileId: number, userId: string): Promise<void> {
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);
  if (!row) throw new Error("Profile not found or access denied");
}

const GALLERY_NOT_MIGRATED = "Gallery is not available. Run the database migration (see drizzle/apply-missing.sql).";

/** Add a gallery item. Caller must own the profile. */
export async function addGalleryItem(
  profileId: number,
  userId: string,
  data: { imageUrl: string; title?: string | null; description?: string | null }
): Promise<GalleryItem> {
  try {
    await ensureProfileOwnership(profileId, userId);
    const [max] = await db
      .select({ max: sql<number>`coalesce(max(${galleryItems.sortOrder}), -1) + 1` })
      .from(galleryItems)
      .where(eq(galleryItems.profileId, profileId));
    const sortOrder = max?.max ?? 0;
    const [row] = await db
      .insert(galleryItems)
      .values({
        profileId,
        imageUrl: data.imageUrl.trim().slice(0, 2048),
        title: data.title?.trim().slice(0, 200) ?? null,
        description: data.description?.trim().slice(0, 1000) ?? null,
        sortOrder,
      })
      .returning();
    if (!row) throw new Error("Insert failed");
    return {
      id: row.id,
      imageUrl: row.imageUrl,
      title: row.title ?? undefined,
      description: row.description ?? undefined,
      sortOrder: row.sortOrder,
    };
  } catch (err) {
    if (isRelationNotFound(err)) throw new Error(GALLERY_NOT_MIGRATED);
    throw err;
  }
}

/** Update a gallery item. Caller must own the profile. */
export async function updateGalleryItem(
  itemId: number,
  userId: string,
  data: { title?: string | null; description?: string | null }
): Promise<GalleryItem> {
  try {
    const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, itemId)).limit(1);
    if (!item) throw new Error("Gallery item not found");
    await ensureProfileOwnership(item.profileId, userId);
    const [row] = await db
      .update(galleryItems)
      .set({
        ...(data.title !== undefined && { title: data.title?.trim().slice(0, 200) ?? null }),
        ...(data.description !== undefined && { description: data.description?.trim().slice(0, 1000) ?? null }),
      })
      .where(eq(galleryItems.id, itemId))
      .returning();
    if (!row) throw new Error("Update failed");
    return {
      id: row.id,
      imageUrl: row.imageUrl,
      title: row.title ?? undefined,
      description: row.description ?? undefined,
      sortOrder: row.sortOrder,
    };
  } catch (err) {
    if (isRelationNotFound(err)) throw new Error(GALLERY_NOT_MIGRATED);
    throw err;
  }
}

/** Delete a gallery item. Caller must own the profile. */
export async function deleteGalleryItem(itemId: number, userId: string): Promise<void> {
  try {
    const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, itemId)).limit(1);
    if (!item) throw new Error("Gallery item not found");
    await ensureProfileOwnership(item.profileId, userId);
    await db.delete(galleryItems).where(eq(galleryItems.id, itemId));
  } catch (err) {
    if (isRelationNotFound(err)) throw new Error(GALLERY_NOT_MIGRATED);
    throw err;
  }
}

/** Reorder gallery items by providing ordered ids. Caller must own the profile. */
export async function setGalleryOrder(profileId: number, userId: string, orderedIds: number[]): Promise<void> {
  if (orderedIds.length === 0) return;
  try {
    await ensureProfileOwnership(profileId, userId);
    const updates = orderedIds.map((id, index) =>
      db.update(galleryItems).set({ sortOrder: index }).where(and(eq(galleryItems.id, id), eq(galleryItems.profileId, profileId)))
    );
    await Promise.all(updates);
  } catch (err) {
    if (isRelationNotFound(err)) throw new Error(GALLERY_NOT_MIGRATED);
    throw err;
  }
}
