/**
 * Member profiles (DB-backed): one profile per user, view tracking, basic edit.
 * Static profiles remain in lib/profiles.ts and are not listed in the dashboard.
 */
import { eq, and, desc } from "drizzle-orm";
import { db, users, profiles, profileViews } from "@/lib/db";
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

/** Get or create user by Discord id (session.sub). New users are created with approved: false. */
export async function getOrCreateUser(session: SessionUser): Promise<UserWithApproval> {
  const id = session.sub;
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (existing) {
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

/** List users that are not yet approved (for admin panel). */
export async function getPendingUsersList(): Promise<
  { id: string; username: string | null; displayName: string | null; avatarUrl: string | null; createdAt: Date }[]
> {
  const rows = await db
    .select({ id: users.id, username: users.username, displayName: users.displayName, avatarUrl: users.avatarUrl, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.approved, false))
    .orderBy(desc(users.createdAt));
  return rows;
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

/** List all users for admin (id, username, displayName, avatarUrl, approved, verified, staff, createdAt). */
export async function getUsersForAdminList(): Promise<
  { id: string; username: string | null; displayName: string | null; avatarUrl: string | null; approved: boolean; verified: boolean; staff: boolean; createdAt: Date }[]
> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      approved: users.approved,
      verified: users.verified,
      staff: users.staff,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
  return rows;
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

/** Get profile slug for a user (for revalidation). Returns null if no profile. */
export async function getProfileSlugByUserId(userId: string): Promise<string | null> {
  const [row] = await db.select({ slug: profiles.slug }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return row?.slug ?? null;
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
  badges?: { verified: boolean; staff: boolean }
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
