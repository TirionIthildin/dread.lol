/**
 * Alternate profile URL slugs: /alias resolves to the same profile as the primary slug.
 */
import { ObjectId } from "mongodb";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { ProfileRow } from "@/lib/db";
import { isReservedProfileSlug, normalizeSlug } from "@/lib/slug";
import { PROFILE_ALIAS_MAX_FREE, PROFILE_ALIAS_MAX_PREMIUM } from "@/lib/premium-features";

export interface ResolvedMemberProfile {
  profile: ProfileRow;
  /** Primary slug from profiles.slug (canonical URL). */
  canonicalSlug: string;
  /** True when the request slug matched profile_aliases, not profiles.slug. */
  viaAlias: boolean;
}

function toProfileRow(doc: { _id: ObjectId } & Record<string, unknown>): ProfileRow {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as ProfileRow;
}

/**
 * Resolve a public profile URL segment to a profile (primary slug or alias).
 */
export async function resolveMemberProfileBySlug(rawSlug: string): Promise<ResolvedMemberProfile | null> {
  const slug = normalizeSlug(rawSlug) || rawSlug.trim().toLowerCase();
  if (!slug) return null;

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);

  const primary = await db.collection(COLLECTIONS.profiles).findOne({ slug });
  if (primary) {
    return {
      profile: toProfileRow(primary),
      canonicalSlug: primary.slug as string,
      viaAlias: false,
    };
  }

  const aliasDoc = await db.collection(COLLECTIONS.profileAliases).findOne({ slug });
  if (!aliasDoc || !aliasDoc.profileId) return null;

  const pid = aliasDoc.profileId as ObjectId;
  const profileDoc = await db.collection(COLLECTIONS.profiles).findOne({ _id: pid });
  if (!profileDoc) return null;
  const profile = toProfileRow(profileDoc);

  return {
    profile,
    canonicalSlug: profile.slug,
    viaAlias: true,
  };
}

export interface ProfileAlias {
  id: string;
  slug: string;
  createdAt: Date;
}

export async function listProfileAliases(profileId: string): Promise<ProfileAlias[]> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return [];
  }
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection(COLLECTIONS.profileAliases)
    .find({ profileId: oid })
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map((d) => ({
    id: (d._id as ObjectId).toString(),
    slug: d.slug as string,
    createdAt: d.createdAt as Date,
  }));
}

export async function countProfileAliases(profileId: string): Promise<number> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return 0;
  }
  const client = await getDb();
  const dbName = await getDbName();
  return client.db(dbName).collection(COLLECTIONS.profileAliases).countDocuments({ profileId: oid });
}

export function maxAliasesForPremium(hasPremium: boolean): number {
  return hasPremium ? PROFILE_ALIAS_MAX_PREMIUM : PROFILE_ALIAS_MAX_FREE;
}

async function ensureProfileOwnership(profileId: string, userId: string): Promise<ProfileRow> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    throw new Error("Profile not found or access denied");
  }
  const doc = await client.db(dbName).collection(COLLECTIONS.profiles).findOne({ _id: oid });
  const profile = doc ? toProfileRow(doc) : null;
  if (!profile || profile.userId !== userId) throw new Error("Profile not found or access denied");
  return profile;
}

/** True if slug is used as another profile's primary slug (excluding optional profile id). */
export async function isPrimarySlugTaken(
  slug: string,
  excludeProfileId?: string | null
): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client.db(dbName).collection(COLLECTIONS.profiles).findOne({ slug });
  if (!doc) return false;
  if (excludeProfileId && doc._id.toString() === excludeProfileId) return false;
  return true;
}

/** True if slug exists on profile_aliases (excluding optional alias document id). */
export async function isAliasSlugTaken(
  slug: string,
  excludeAliasId?: string | null
): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client.db(dbName).collection(COLLECTIONS.profileAliases).findOne({ slug });
  if (!doc) return false;
  if (excludeAliasId && doc._id.toString() === excludeAliasId) return false;
  return true;
}

/**
 * Create an alias. Enforces global slug uniqueness vs primary + aliases, reserved slugs, and tier limits.
 */
export async function createProfileAlias(
  profileId: string,
  userId: string,
  rawSlug: string,
  hasPremium: boolean
): Promise<ProfileAlias> {
  const profile = await ensureProfileOwnership(profileId, userId);
  const slug = normalizeSlug(rawSlug);
  if (!slug) throw new Error("Slug is required (letters, numbers, hyphen, underscore)");
  if (isReservedProfileSlug(slug)) {
    throw new Error("This slug is reserved");
  }

  const max = maxAliasesForPremium(hasPremium);
  const count = await countProfileAliases(profileId);
  if (count >= max) {
    throw new Error(
      hasPremium
        ? `You can have at most ${PROFILE_ALIAS_MAX_PREMIUM} profile aliases.`
        : `Free accounts can have ${PROFILE_ALIAS_MAX_FREE} profile alias. Upgrade to Premium for more.`
    );
  }

  if (slug === profile.slug) {
    throw new Error("That slug is already your primary profile URL");
  }

  if (await isPrimarySlugTaken(slug)) {
    throw new Error("That slug is already taken");
  }
  if (await isAliasSlugTaken(slug)) {
    throw new Error("That slug is already taken");
  }

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    throw new Error("Invalid profile");
  }

  const now = new Date();
  const inserted = await db.collection(COLLECTIONS.profileAliases).insertOne({
    _id: new ObjectId(),
    profileId: oid,
    slug,
    createdAt: now,
  });

  return {
    id: inserted.insertedId.toString(),
    slug,
    createdAt: now,
  };
}

export async function deleteProfileAlias(aliasId: string, userId: string): Promise<{ slug: string }> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(aliasId);
  } catch {
    throw new Error("Invalid alias");
  }

  const doc = await client.db(dbName).collection(COLLECTIONS.profileAliases).findOne({ _id: oid });
  if (!doc) throw new Error("Alias not found");

  await ensureProfileOwnership(doc.profileId.toString(), userId);

  const slug = doc.slug as string;
  await client.db(dbName).collection(COLLECTIONS.profileAliases).deleteOne({ _id: oid });
  return { slug };
}
