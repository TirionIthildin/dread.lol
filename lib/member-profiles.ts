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

/** Get or create user by Discord id (session.sub). Use session.sub as user id. */
export async function getOrCreateUser(session: SessionUser): Promise<{ id: string }> {
  const id = session.sub;
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (existing) return { id: existing.id };
  await db.insert(users).values({
    id,
    discordUserId: session.sub,
    username: session.preferred_username ?? undefined,
    displayName: session.name ?? undefined,
    avatarUrl: session.picture ?? undefined,
  });
  return { id };
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
    easterEgg?: boolean;
    easterEggTaglineWord?: string;
    easterEggLinkTrigger?: string;
    easterEggLinkUrl?: string;
    easterEggLinkPopupUrl?: string;
    links?: string | null;
    ogImageUrl?: string;
    showUpdatedAt?: boolean;
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

function formatUpdatedAt(d: Date): string {
  return new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
}

/** Convert DB profile row to the Profile shape used by ProfileContent. */
export function memberProfileToProfile(row: ProfileRow): Profile {
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
    easterEgg: row.easterEgg ?? undefined,
    easterEggTaglineWord: row.easterEggTaglineWord ?? undefined,
    easterEggLink,
    links,
    ogImageUrl: row.ogImageUrl ?? undefined,
    updatedAt: row.showUpdatedAt && row.updatedAt ? formatUpdatedAt(row.updatedAt) : undefined,
  };
}
