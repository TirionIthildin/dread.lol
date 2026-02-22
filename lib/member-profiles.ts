/**
 * Member profiles (MongoDB-backed): one profile per user, view tracking, basic edit.
 */
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import {
  getDb,
  getDbName,
  COLLECTIONS,
  type ProfileRow,
  type ProfileViewRow,
  type UserDoc,
} from "@/lib/db";
import type { Profile } from "@/lib/profiles";
import { decodeDiscordPublicFlags, getPremiumBadgeKeys } from "@/lib/discord-badges";
import {
  isPremiumNameAnimation,
  isPremiumFieldAnimation,
  isPremiumBackgroundEffect,
} from "@/lib/premium-features";
import type { SessionUser } from "@/lib/auth/session";
import { escapeRegex } from "@/lib/regex";
import { getBaseDomain } from "@/lib/site";

export interface MemberProfileWithViews {
  profile: ProfileRow;
  viewCount: number;
  recentViews: { visitorIp: string; viewedAt: Date; userAgent: string | null }[];
}

export interface UserWithApproval {
  /** Account creation date (for Basic trial). */
  createdAt?: Date;
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

function toProfileRow(doc: { _id: ObjectId } & Record<string, unknown>): ProfileRow {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as ProfileRow;
}

/** Get or create user by Discord id (session.sub). */
export async function getOrCreateUser(session: SessionUser): Promise<UserWithApproval> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const users = db.collection<UserDoc>(COLLECTIONS.users);

  const id = session.sub;
  const existing = await users.findOne({ _id: id });
  if (existing) {
    const hasProfileChanges =
      existing.displayName !== session.name ||
      existing.username !== session.preferred_username ||
      existing.avatarUrl !== session.picture;
    const hasFlagsChange =
      session.public_flags != null && existing.discordPublicFlags !== session.public_flags;
    const hasPremiumChange =
      session.premium_type != null && session.premium_type > 0 && existing.discordPremiumType !== session.premium_type;
    if (hasProfileChanges || hasFlagsChange || hasPremiumChange) {
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (hasProfileChanges) {
        update.displayName = session.name ?? null;
        update.username = session.preferred_username ?? null;
        update.avatarUrl = session.picture ?? null;
      }
      if (hasFlagsChange) update.discordPublicFlags = session.public_flags;
      if (hasPremiumChange) update.discordPremiumType = session.premium_type;
      await users.updateOne({ _id: id }, { $set: update });
    }
    return {
      id: existing._id,
      approved: existing.approved,
      isAdmin: existing.isAdmin || getAdminDiscordIds().includes(existing.discordUserId),
      createdAt: existing.createdAt,
    };
  }
  const now = new Date();
  try {
    await users.insertOne({
      _id: id,
      discordUserId: session.sub,
      username: session.preferred_username ?? null,
      displayName: session.name ?? null,
      avatarUrl: session.picture ?? null,
      approved: true,
      isAdmin: false,
      verified: false,
      staff: false,
      discordPublicFlags: session.public_flags ?? null,
      discordPremiumType: (session as { premium_type?: number }).premium_type ?? null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err: unknown) {
    // Race: another request created the user first (E11000 duplicate key)
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      const existing = await users.findOne({ _id: id });
      if (existing) {
        return {
          id: existing._id,
          approved: existing.approved,
          isAdmin: existing.isAdmin || getAdminDiscordIds().includes(existing.discordUserId),
          createdAt: existing.createdAt,
        };
      }
    }
    throw err;
  }
  return { id, approved: true, isAdmin: getAdminDiscordIds().includes(session.sub), createdAt: now };
}

export type PendingUserRow = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export async function getPendingUsersList(): Promise<PendingUserRow[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const users = db.collection<UserDoc>(COLLECTIONS.users);

  const cursor = users
    .find({ approved: false })
    .project({ _id: 1, username: 1, displayName: 1, avatarUrl: 1, createdAt: 1 })
    .sort({ createdAt: -1 });
  const docs = await cursor.toArray();
  return docs.map((d) => ({
    id: d._id,
    username: d.username ?? null,
    displayName: d.displayName ?? null,
    avatarUrl: d.avatarUrl ?? null,
    createdAt: d.createdAt,
  }));
}

export async function getPendingUsersListPaginated(options: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: PendingUserRow[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;
  const search = options.search?.trim();

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const users = db.collection<UserDoc>(COLLECTIONS.users);

  const filter: Record<string, unknown> = { approved: false };
  if (search) {
    const escaped = escapeRegex(search);
    filter.$or = [
      { username: { $regex: escaped, $options: "i" } },
      { displayName: { $regex: escaped, $options: "i" } },
      { _id: { $regex: escaped, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    users
      .find(filter)
      .project({ _id: 1, username: 1, displayName: 1, avatarUrl: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    users.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    items: items.map((d) => ({
      id: d._id,
      username: d.username ?? null,
      displayName: d.displayName ?? null,
      avatarUrl: d.avatarUrl ?? null,
      createdAt: d.createdAt,
    })),
    total,
    page,
    limit,
    totalPages,
  };
}

export async function approveUser(userId: string): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const result = await db.collection<UserDoc>(COLLECTIONS.users).updateOne(
    { _id: userId },
    { $set: { approved: true, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function getUserBadges(userId: string): Promise<{ verified: boolean; staff: boolean }> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const row = await db.collection<UserDoc>(COLLECTIONS.users).findOne(
    { _id: userId },
    { projection: { verified: 1, staff: 1 } }
  );
  if (!row) return { verified: false, staff: false };
  return { verified: row.verified ?? false, staff: row.staff ?? false };
}

const DEBUG_DISCORD_FLAGS =
  process.env.DEBUG_DISCORD_FLAGS === "1" ||
  (process.env.NODE_ENV === "development" && process.env.DEBUG_DISCORD_FLAGS !== "0");

export interface DiscordBadgeData {
  flags: number | null;
  premiumType: number | null;
}

export async function getUserDiscordBadgeData(userId: string): Promise<DiscordBadgeData> {
  const {
    getDiscordFlagsFromRedis,
    getDiscordPremiumFromRedis,
    setDiscordFlagsInRedis,
    setDiscordPremiumInRedis,
    fetchDiscordUserFromApi,
  } = await import("@/lib/discord-flags");
  if (DEBUG_DISCORD_FLAGS) console.log("[DiscordFlags] getUserDiscordBadgeData", { userId });

  const client = await getDb();
  const dbName = await getDbName();

  const flagsRedis = await getDiscordFlagsFromRedis(userId);
  const premiumRedis = await getDiscordPremiumFromRedis(userId);

  const row = await client.db(dbName).collection<UserDoc>(COLLECTIONS.users).findOne(
    { _id: userId },
    { projection: { discordPublicFlags: 1, discordPremiumType: 1 } }
  );
  const flagsDb = row?.discordPublicFlags ?? null;
  const premiumDb = row?.discordPremiumType ?? null;

  let flags = flagsRedis ?? flagsDb;
  let premiumType = premiumRedis ?? premiumDb;

  if (flags != null && premiumType != null) {
    if (DEBUG_DISCORD_FLAGS) console.log("[DiscordFlags] Using cache", { userId, flags, premium: premiumType });
    return { flags, premiumType };
  }

  if (flags != null && premiumType == null) {
    if (DEBUG_DISCORD_FLAGS) console.log("[DiscordFlags] Have flags, missing premium, trying API", { userId });
  } else if (DEBUG_DISCORD_FLAGS) {
    console.log("[DiscordFlags] Redis+DB miss, trying API", { userId });
  }

  const fromApi = await fetchDiscordUserFromApi(userId);
  if (fromApi) {
    if (DEBUG_DISCORD_FLAGS) console.log("[DiscordFlags] API success, persisting", { userId, ...fromApi });
    flags = fromApi.publicFlags;
    premiumType = fromApi.premiumType;
    await setDiscordFlagsInRedis(userId, flags);
    if (premiumType > 0) {
      await setDiscordPremiumInRedis(userId, premiumType);
    }
    await client.db(dbName).collection<UserDoc>(COLLECTIONS.users).updateOne(
      { _id: userId },
      {
        $set: {
          discordPublicFlags: flags,
          ...(premiumType > 0 && { discordPremiumType: premiumType }),
          updatedAt: new Date(),
        },
      }
    );
    return { flags, premiumType };
  }

  flags = flags ?? null;
  premiumType = premiumType ?? null;
  if (DEBUG_DISCORD_FLAGS) console.log("[DiscordFlags] Final", { userId, flags, premium: premiumType });
  return { flags, premiumType };
}

/** @deprecated Use getUserDiscordBadgeData. Kept for backward compat. */
export async function getUserDiscordFlags(userId: string): Promise<number | null> {
  const { flags } = await getUserDiscordBadgeData(userId);
  return flags;
}

export async function setUserBadges(
  userId: string,
  badgeFlags: { verified?: boolean; staff?: boolean; premiumGranted?: boolean }
): Promise<boolean> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof badgeFlags.verified === "boolean") updates.verified = badgeFlags.verified;
  if (typeof badgeFlags.staff === "boolean") updates.staff = badgeFlags.staff;
  if (typeof badgeFlags.premiumGranted === "boolean") updates.premiumGranted = badgeFlags.premiumGranted;
  if (Object.keys(updates).length <= 1) return true;

  const client = await getDb();
  const dbName = await getDbName();
  const result = await client.db(dbName).collection<UserDoc>(COLLECTIONS.users).updateOne(
    { _id: userId },
    { $set: updates }
  );
  return result.matchedCount > 0;
}

export async function setUserRestricted(userId: string, restricted: boolean): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  const result = await client.db(dbName).collection<UserDoc>(COLLECTIONS.users).updateOne(
    { _id: userId },
    { $set: { restricted, updatedAt: new Date() } }
  );
  return result.matchedCount > 0;
}

export interface CustomBadge {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  color?: string | null;
  sortOrder: number;
  badgeType?: string | null;
  imageUrl?: string | null;
  iconName?: string | null;
}

export async function getCustomBadgesForUser(userId: string): Promise<CustomBadge[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const userBadges = db.collection(COLLECTIONS.userBadges);
  const badges = db.collection(COLLECTIONS.badges);
  const userCreatedBadges = db.collection(COLLECTIONS.userCreatedBadges);

  const [ubDocs, userCreatedDocs] = await Promise.all([
    userBadges.find({ userId }).toArray(),
    userCreatedBadges.find({ userId }).sort({ sortOrder: 1, _id: 1 }).toArray(),
  ]);

  const result: CustomBadge[] = [];

  if (ubDocs.length > 0) {
    const badgeIds = ubDocs.map((ub) => ub.badgeId);
    const badgeDocs = await badges.find({ _id: { $in: badgeIds } }).sort({ sortOrder: 1 }).toArray();
    const assigned = badgeDocs
      .sort((a, b) => a.sortOrder - b.sortOrder || a._id.toString().localeCompare(b._id.toString()))
      .map((b) => ({
        id: b._id.toString(),
        key: b.key,
        label: b.label,
        description: b.description ?? undefined,
        color: b.color ?? undefined,
        sortOrder: b.sortOrder,
        badgeType: b.badgeType ?? undefined,
        imageUrl: b.imageUrl ?? undefined,
        iconName: b.iconName ?? undefined,
      }));
    result.push(...assigned);
  }

  for (const uc of userCreatedDocs) {
    if (uc.label) {
      result.push({
        id: (uc._id ?? "").toString(),
        key: "user-created",
        label: uc.label,
        description: uc.description ?? undefined,
        color: uc.color ?? undefined,
        sortOrder: uc.sortOrder ?? 999,
        badgeType: uc.badgeType ?? undefined,
        imageUrl: uc.imageUrl ?? undefined,
        iconName: uc.iconName ?? undefined,
      });
    }
  }

  return result.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export async function getAllCustomBadges(): Promise<CustomBadge[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const docs = await db.collection(COLLECTIONS.badges).find().sort({ sortOrder: 1 }).toArray();
  return docs.map((b) => ({
    id: b._id.toString(),
    key: b.key,
    label: b.label,
    description: b.description ?? undefined,
    color: b.color ?? undefined,
    sortOrder: b.sortOrder,
    badgeType: b.badgeType ?? undefined,
    imageUrl: b.imageUrl ?? undefined,
    iconName: b.iconName ?? undefined,
  }));
}

export async function getUserCustomBadgeIds(userId: string): Promise<string[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const docs = await db.collection(COLLECTIONS.userBadges).find({ userId }).toArray();
  return docs.map((ub) => ub.badgeId.toString());
}

export async function setUserCustomBadges(userId: string, badgeIds: string[]): Promise<void> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const userBadges = db.collection(COLLECTIONS.userBadges);

  await userBadges.deleteMany({ userId });
  if (badgeIds.length > 0) {
    await userBadges.insertMany(
      badgeIds.map((badgeId) => ({
        _id: new ObjectId(),
        userId,
        badgeId: new ObjectId(badgeId),
      }))
    );
  }
}

export async function createBadge(data: {
  key: string;
  label: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  badgeType?: string;
  imageUrl?: string;
  iconName?: string;
}): Promise<{ id: string } | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const result = await db.collection(COLLECTIONS.badges).insertOne({
    key: data.key.trim(),
    label: data.label.trim(),
    description: data.description?.trim() || null,
    color: data.color?.trim() || null,
    sortOrder: data.sortOrder ?? 0,
    badgeType: data.badgeType?.trim() || "label",
    imageUrl: data.imageUrl?.trim() || null,
    iconName: data.iconName?.trim() || null,
  });
  return result.acknowledged ? { id: result.insertedId.toString() } : null;
}

export async function updateBadge(
  id: string,
  data: {
    key?: string;
    label?: string;
    description?: string;
    color?: string;
    sortOrder?: number;
    badgeType?: string;
    imageUrl?: string;
    iconName?: string;
  }
): Promise<boolean> {
  const updates: Record<string, unknown> = {};
  if (data.key !== undefined) updates.key = data.key.trim();
  if (data.label !== undefined) updates.label = data.label.trim();
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.color !== undefined) updates.color = data.color?.trim() || null;
  if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
  if (data.badgeType !== undefined) updates.badgeType = data.badgeType?.trim() || null;
  if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl?.trim() || null;
  if (data.iconName !== undefined) updates.iconName = data.iconName?.trim() || null;
  if (Object.keys(updates).length === 0) return true;

  const client = await getDb();
  const dbName = await getDbName();
  const result = await client.db(dbName).collection(COLLECTIONS.badges).updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );
  return result.matchedCount > 0;
}

export async function deleteBadge(id: string): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  const result = await client.db(dbName).collection(COLLECTIONS.badges).deleteOne({
    _id: new ObjectId(id),
  });
  if (result.deletedCount > 0) {
    await client.db(dbName).collection(COLLECTIONS.userBadges).deleteMany({ badgeId: new ObjectId(id) });
  }
  return result.deletedCount > 0;
}

export type AdminUserRow = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  approved: boolean;
  verified: boolean;
  staff: boolean;
  premiumGranted: boolean;
  restricted?: boolean;
  createdAt: Date;
};

export async function getAdminUserById(userId: string): Promise<AdminUserRow | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne(
      { _id: userId },
      { projection: { _id: 1, username: 1, displayName: 1, avatarUrl: 1, approved: 1, verified: 1, staff: 1, premiumGranted: 1, restricted: 1, createdAt: 1 } }
    );
  return doc
    ? {
        id: doc._id,
        username: doc.username ?? null,
        displayName: doc.displayName ?? null,
        avatarUrl: doc.avatarUrl ?? null,
        approved: doc.approved ?? false,
        verified: doc.verified ?? false,
        staff: doc.staff ?? false,
        premiumGranted: doc.premiumGranted ?? false,
        restricted: doc.restricted ?? false,
        createdAt: doc.createdAt,
      }
    : null;
}

export async function getUsersForAdminList(): Promise<AdminUserRow[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection(COLLECTIONS.users)
    .find()
    .project({ _id: 1, username: 1, displayName: 1, avatarUrl: 1, approved: 1, verified: 1, staff: 1, premiumGranted: 1, restricted: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({
    id: d._id,
    username: d.username ?? null,
    displayName: d.displayName ?? null,
    avatarUrl: d.avatarUrl ?? null,
    approved: d.approved ?? false,
    verified: d.verified ?? false,
    staff: d.staff ?? false,
    premiumGranted: d.premiumGranted ?? false,
    restricted: d.restricted ?? false,
    createdAt: d.createdAt,
  }));
}

export async function getUsersForAdminListSearch(search?: string): Promise<AdminUserRow[]> {
  const q = search?.trim();
  const client = await getDb();
  const dbName = await getDbName();
  const escaped = q ? escapeRegex(q) : "";
  const filter: Record<string, unknown> = escaped
    ? {
        $or: [
          { username: { $regex: escaped, $options: "i" } },
          { displayName: { $regex: escaped, $options: "i" } },
          { _id: { $regex: escaped, $options: "i" } },
        ],
      }
    : {};
  const docs = await client
    .db(dbName)
    .collection(COLLECTIONS.users)
    .find(filter)
    .project({ _id: 1, username: 1, displayName: 1, avatarUrl: 1, approved: 1, verified: 1, staff: 1, premiumGranted: 1, restricted: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({
    id: d._id,
    username: d.username ?? null,
    displayName: d.displayName ?? null,
    avatarUrl: d.avatarUrl ?? null,
    approved: d.approved ?? false,
    verified: d.verified ?? false,
    staff: d.staff ?? false,
    premiumGranted: d.premiumGranted ?? false,
    restricted: d.restricted ?? false,
    createdAt: d.createdAt,
  }));
}

export async function getOrCreateMemberProfile(
  userId: string,
  defaults: { name: string; slug: string; avatarUrl?: string }
): Promise<ProfileRow> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const profiles = db.collection(COLLECTIONS.profiles);

  const existing = await profiles.findOne({ userId });
  if (existing) return toProfileRow(existing);

  let slug = defaults.slug || "member";
  for (let i = 0; i < 10; i++) {
    try {
      const now = new Date();
      const doc = {
        _id: new ObjectId(),
        userId,
        slug,
        name: defaults.name,
        description: "",
        avatarUrl: defaults.avatarUrl ?? null,
        showPageViews: true,
        createdAt: now,
        updatedAt: now,
      };
      await profiles.insertOne(doc);
      return toProfileRow(doc);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if ((msg.includes("duplicate") || msg.includes("E11000")) && i < 9) {
        slug = `${defaults.slug}-${userId.slice(-8)}`;
      } else {
        throw err;
      }
    }
  }
  throw new Error("Failed to create profile: slug conflict");
}

export async function getMemberProfileBySlug(slug: string): Promise<ProfileRow | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client.db(dbName).collection(COLLECTIONS.profiles).findOne({ slug });
  return doc ? toProfileRow(doc) : null;
}

export async function getMemberProfileById(profileId: string): Promise<ProfileRow | null> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return null;
  }
  const doc = await client.db(dbName).collection(COLLECTIONS.profiles).findOne({ _id: oid });
  return doc ? toProfileRow(doc) : null;
}

export async function getProfileSlugByUserId(userId: string): Promise<string | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client.db(dbName).collection(COLLECTIONS.profiles).findOne(
    { userId },
    { projection: { slug: 1 } }
  );
  return doc?.slug ?? null;
}

/** Batch resolve userId → slug for many users. Returns Map<userId, slug>. */
export async function getProfileSlugsByUserIds(userIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection(COLLECTIONS.profiles)
    .find({ userId: { $in: unique } }, { projection: { userId: 1, slug: 1 } })
    .toArray();
  const map = new Map<string, string>();
  for (const d of docs) {
    const row = d as unknown as { userId: string; slug: string };
    if (row.userId && row.slug) map.set(row.userId, row.slug);
  }
  return map;
}

export async function getAllMemberProfileSlugs(): Promise<string[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client.db(dbName).collection(COLLECTIONS.profiles).find({}, { projection: { slug: 1 } }).toArray();
  return docs.map((d) => d.slug);
}

export interface VouchedByUser {
  userId: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

export async function getVouchesForProfile(profileId: string): Promise<{
  count: number;
  vouchedBy: VouchedByUser[];
}> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return { count: 0, vouchedBy: [] };
  }

  const vouches = await db
    .collection(COLLECTIONS.vouches)
    .find({ profileId: oid })
    .sort({ createdAt: -1 })
    .toArray();
  if (vouches.length === 0) return { count: 0, vouchedBy: [] };

  const userIds = [...new Set(vouches.map((v) => v.userId))];
  const users = await db.collection<UserDoc>(COLLECTIONS.users).find({ _id: { $in: userIds } }).toArray();
  const userMap = new Map(users.map((u) => [u._id, u]));

  const vouchedBy: VouchedByUser[] = vouches.map((v) => {
    const u = userMap.get(v.userId);
    return {
      userId: v.userId,
      displayName: u?.displayName ?? null,
      username: u?.username ?? null,
      avatarUrl: u?.avatarUrl ?? null,
    };
  });
  return { count: vouchedBy.length, vouchedBy };
}

export async function addVouch(profileId: string, userId: string): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return false;
  }

  const profile = await db.collection(COLLECTIONS.profiles).findOne({ _id: oid }, { projection: { userId: 1 } });
  if (!profile || profile.userId === userId) return false;

  try {
    await db.collection(COLLECTIONS.vouches).insertOne({
      _id: new ObjectId(),
      profileId: oid,
      userId,
      createdAt: new Date(),
    });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("E11000") || msg.includes("duplicate")) return false;
    throw err;
  }
}

export async function removeVouch(profileId: string, userId: string): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return false;
  }
  const result = await client.db(dbName).collection(COLLECTIONS.vouches).deleteOne({
    profileId: oid,
    userId,
  });
  return result.deletedCount > 0;
}

/**
 * Get users who have vouched both the viewer's profile and the viewed profile.
 * Returns empty if viewer is not logged in or has no profile.
 */
export async function getMutualVouchers(
  viewerUserId: string,
  viewedProfileId: string,
  viewedProfileOwnerUserId: string
): Promise<VouchedByUser[]> {
  if (viewerUserId === viewedProfileOwnerUserId) return [];
  let viewedOid: ObjectId;
  try {
    viewedOid = new ObjectId(viewedProfileId);
  } catch {
    return [];
  }
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const viewerProfile = await db
    .collection(COLLECTIONS.profiles)
    .findOne({ userId: viewerUserId }, { projection: { _id: 1 } });
  if (!viewerProfile) return [];
  const viewerProfileOid = viewerProfile._id as ObjectId;
  const [viewerVouchers, viewedVouchers] = await Promise.all([
    db.collection(COLLECTIONS.vouches).find({ profileId: viewerProfileOid }).toArray(),
    db.collection(COLLECTIONS.vouches).find({ profileId: viewedOid }).toArray(),
  ]);
  const viewerSet = new Set(viewerVouchers.map((v) => v.userId));
  const mutualIds = viewedVouchers.map((v) => v.userId).filter((id) => viewerSet.has(id));
  if (mutualIds.length === 0) return [];
  const users = await db.collection<UserDoc>(COLLECTIONS.users).find({ _id: { $in: mutualIds } }).toArray();
  const userMap = new Map(users.map((u) => [u._id, u]));
  return mutualIds.map((id) => {
    const u = userMap.get(id);
    return {
      userId: id,
      displayName: u?.displayName ?? null,
      username: u?.username ?? null,
      avatarUrl: u?.avatarUrl ?? null,
    };
  });
}

/**
 * Top profiles by vouches received in the current month.
 */
export async function getLeaderboardTopVouches(limit = 20): Promise<
  { slug: string; name: string; count: number }[]
> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const pipeline = [
    { $match: { createdAt: { $gte: startOfMonth } } },
    { $group: { _id: "$profileId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: COLLECTIONS.profiles,
        localField: "_id",
        foreignField: "_id",
        as: "profile",
        pipeline: [{ $project: { slug: 1, name: 1 } }],
      },
    },
    { $unwind: "$profile" },
    { $project: { slug: "$profile.slug", name: "$profile.name", count: 1, _id: 0 } },
  ];
  const results = await db.collection(COLLECTIONS.vouches).aggregate(pipeline).toArray();
  return results as { slug: string; name: string; count: number }[];
}

/**
 * Trending profiles this week: combined score from vouches and views in last 7 days.
 */
export async function getTrendingProfiles(limit = 10): Promise<
  { slug: string; name: string; score: number }[]
> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [vouchesResult, viewsResult] = await Promise.all([
    db
      .collection(COLLECTIONS.vouches)
      .aggregate<{ _id: ObjectId; count: number }>([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: "$profileId", count: { $sum: 1 } } },
      ])
      .toArray(),
    db
      .collection(COLLECTIONS.profileViews)
      .aggregate<{ _id: ObjectId; uniqueCount: number }>([
        { $match: { viewedAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: {
              profileId: "$profileId",
              visitorKey: {
                $ifNull: [
                  "$visitorKey",
                  { $concat: ["$visitorIp", "|", { $ifNull: ["$userAgent", ""] }] },
                ],
              },
            },
          },
        },
        { $group: { _id: "$_id.profileId", uniqueCount: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const scoreMap = new Map<string, number>();
  for (const row of vouchesResult) {
    const id = (row._id as ObjectId).toString();
    scoreMap.set(id, (scoreMap.get(id) ?? 0) + row.count * 100);
  }
  for (const row of viewsResult) {
    const id = (row._id as ObjectId).toString();
    scoreMap.set(id, (scoreMap.get(id) ?? 0) + row.uniqueCount);
  }

  const sorted = [...scoreMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (sorted.length === 0) return [];

  const profiles = await db
    .collection(COLLECTIONS.profiles)
    .find({ _id: { $in: sorted.map(([id]) => new ObjectId(id)) } })
    .project({ slug: 1, name: 1 })
    .toArray();
  const profileMap = new Map(profiles.map((p) => [(p._id as ObjectId).toString(), p]));
  return sorted.map(([id, score]) => {
    const p = profileMap.get(id) as { slug: string; name: string } | undefined;
    return { slug: p?.slug ?? "?", name: p?.name ?? "?", score };
  });
}

/**
 * Mutual Discord guilds between viewer and profile owner. Returns guild names.
 */
export async function getMutualGuilds(
  viewerUserId: string,
  profileOwnerUserId: string
): Promise<string[]> {
  if (viewerUserId === profileOwnerUserId) return [];
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const [viewerGuilds, ownerGuilds] = await Promise.all([
    db.collection(COLLECTIONS.userGuilds).findOne(
      { userId: viewerUserId },
      { projection: { guilds: 1 } }
    ),
    db.collection(COLLECTIONS.userGuilds).findOne(
      { userId: profileOwnerUserId },
      { projection: { guilds: 1 } }
    ),
  ]);
  const viewer = (viewerGuilds as { guilds?: { id: string; name: string }[] } | null)?.guilds ?? [];
  const owner = (ownerGuilds as { guilds?: { id: string; name: string }[] } | null)?.guilds ?? [];
  const ownerIds = new Set(owner.map((g) => g.id));
  const ownerMap = new Map(owner.map((g) => [g.id, g.name]));
  return viewer
    .filter((g) => ownerIds.has(g.id))
    .map((g) => ownerMap.get(g.id) ?? g.name)
    .slice(0, 10);
}

/**
 * Similar profiles: share at least one tag. Excludes the given profile.
 */
export async function getSimilarProfiles(
  profileId: string,
  tags: string[],
  limit = 6
): Promise<{ slug: string; name: string }[]> {
  if (!tags || tags.length === 0) return [];
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return [];
  }
  const profiles = await client
    .db(dbName)
    .collection(COLLECTIONS.profiles)
    .find({
      _id: { $ne: oid },
      tags: { $in: tags },
    })
    .project({ slug: 1, name: 1 })
    .limit(limit)
    .toArray();
  return profiles.map((p) => ({ slug: (p as { slug: string }).slug, name: (p as { name: string }).name ?? (p as { slug: string }).slug }));
}

export async function hasUserVouched(profileId: string, userId: string): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return false;
  }
  const doc = await client.db(dbName).collection(COLLECTIONS.vouches).findOne({
    profileId: oid,
    userId,
  });
  return Boolean(doc);
}

/** Computes a stable key to identify a unique visitor (IP + User-Agent). */
function computeVisitorKey(visitorIp: string, userAgent?: string | null): string {
  const raw = `${visitorIp}|${userAgent ?? ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/** Parse referrer URL to a domain for traffic source analytics. */
function parseReferrerDomain(referrer: string | null | undefined): string | null {
  if (!referrer?.trim()) return null;
  try {
    const u = new URL(referrer.trim());
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

/** Map referrer domain to a human-readable traffic source label. */
function referrerDomainToSource(domain: string, siteHost?: string): string {
  const d = domain.toLowerCase();
  if (siteHost && d === siteHost.replace(/^www\./, "")) return "Internal";
  if (d.includes("google")) return "Google";
  if (d === "x.com" || d === "twitter.com" || d === "t.co") return "X (Twitter)";
  if (d.includes("discord")) return "Discord";
  if (d.includes("github")) return "GitHub";
  if (d.includes("linkedin")) return "LinkedIn";
  if (d.includes("youtube") || d.includes("youtu.be")) return "YouTube";
  if (d.includes("reddit")) return "Reddit";
  if (d.includes("facebook")) return "Facebook";
  if (d.includes("instagram")) return "Instagram";
  if (d.includes("tiktok")) return "TikTok";
  if (d.includes("mastodon")) return "Mastodon";
  if (d.includes("bluesky")) return "Bluesky";
  return domain;
}

/** Parse user agent to device type. */
function parseDeviceType(userAgent: string | null | undefined): "desktop" | "mobile" | "bot" | "unknown" {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/bot|crawl|spider|slurp|headless|phantom|scraper|curl|wget|python|java\s/i.test(ua)) return "bot";
  if (/mobile|android|iphone|ipad|ipod|webos|blackberry|iemobile|opera\smini/i.test(ua)) return "mobile";
  return "desktop";
}

export type RecordProfileViewOptions = {
  viewerUserId?: string | null;
  referrer?: string | null;
  countryCode?: string | null;
};

export async function recordProfileView(
  profileId: string,
  visitorIp: string,
  userAgent?: string | null,
  options?: RecordProfileViewOptions
): Promise<void> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return;
  }
  const visitorKey = computeVisitorKey(visitorIp, userAgent);
  const referrer = options?.referrer ?? null;
  const referrerDomain = referrer ? parseReferrerDomain(referrer) : null;
  const deviceType = parseDeviceType(userAgent);

  await client.db(dbName).collection(COLLECTIONS.profileViews).insertOne({
    _id: new ObjectId(),
    profileId: oid,
    visitorIp,
    userAgent: userAgent ?? null,
    visitorKey,
    viewedAt: new Date(),
    viewerUserId: options?.viewerUserId ?? null,
    referrer: referrer ?? null,
    referrerDomain: referrerDomain ?? null,
    deviceType,
    countryCode: options?.countryCode ?? null,
  });
}

/** Unique view count: distinct visitors (by visitorKey or IP+UA for legacy records). */
export async function getProfileViewCount(profileId: string): Promise<number> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return 0;
  }
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.profileViews)
    .aggregate<{ uniqueCount: number }>([
      { $match: { profileId: oid } },
      {
        $group: {
          _id: {
            $ifNull: [
              "$visitorKey",
              { $concat: ["$visitorIp", "|", { $ifNull: ["$userAgent", ""] }] },
            ],
          },
        },
      },
      { $count: "uniqueCount" },
    ])
    .toArray();
  return result[0]?.uniqueCount ?? 0;
}

export async function getProfileViews(
  profileId: string,
  recentLimit = 50
): Promise<{ viewCount: number; recentViews: ProfileViewRow[] }> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return { viewCount: 0, recentViews: [] };
  }
  const [uniqueResult, allViews] = await Promise.all([
    client
      .db(dbName)
      .collection(COLLECTIONS.profileViews)
      .aggregate<{ uniqueCount: number }>([
        { $match: { profileId: oid } },
        {
          $group: {
            _id: {
              $ifNull: [
                "$visitorKey",
                { $concat: ["$visitorIp", "|", { $ifNull: ["$userAgent", ""] }] },
              ],
            },
          },
        },
        { $count: "uniqueCount" },
      ])
      .toArray(),
    client
      .db(dbName)
      .collection(COLLECTIONS.profileViews)
      .find({ profileId: oid })
      .sort({ viewedAt: -1 })
      .toArray(),
  ]);
  const viewCount = uniqueResult[0]?.uniqueCount ?? 0;
  // Dedupe by visitor (most recent view per unique visitor)
  const seen = new Set<string>();
  const recentViews: ProfileViewRow[] = [];
  for (const v of allViews) {
    const key = (v as { visitorKey?: string }).visitorKey ?? `${v.visitorIp}|${v.userAgent ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    recentViews.push({
      id: v._id.toString(),
      profileId: v.profileId.toString(),
      visitorIp: v.visitorIp,
      userAgent: v.userAgent ?? null,
      viewedAt: v.viewedAt,
    });
    if (recentViews.length >= recentLimit) break;
  }
  return { viewCount, recentViews };
}

/** Viewer with optional profile info (when logged-in and has a profile). */
export interface ProfileViewerRow {
  id: string;
  viewedAt: Date;
  viewerUserId: string | null;
  /** Populated when viewer has a Dread profile. */
  viewerProfile?: { slug: string; name: string; avatarUrl: string | null } | null;
}

/** Full analytics for a profile: who viewed, traffic sources, views over time, devices, countries. */
export interface ProfileAnalytics {
  viewCount: number;
  viewsThisWeek: number;
  viewsOverTime: { date: string; count: number }[];
  trafficSources: { source: string; count: number }[];
  deviceBreakdown: { desktop: number; mobile: number; bot: number; unknown: number };
  countries: { countryCode: string; count: number }[];
  whoViewed: ProfileViewerRow[];
}

export async function getProfileAnalytics(
  profileId: string,
  recentViewersLimit = 25,
  daysBack = 30
): Promise<ProfileAnalytics> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return {
      viewCount: 0,
      viewsThisWeek: 0,
      viewsOverTime: [],
      trafficSources: [],
      deviceBreakdown: { desktop: 0, mobile: 0, bot: 0, unknown: 0 },
      countries: [],
      whoViewed: [],
    };
  }

  const db = client.db(dbName);
  const viewsColl = db.collection(COLLECTIONS.profileViews);
  const profilesColl = db.collection(COLLECTIONS.profiles);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const daysAgo = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const [
    uniqueResult,
    weekResult,
    viewsOverTimeRaw,
    trafficRaw,
    deviceRaw,
    countryRaw,
    recentViews,
  ] = await Promise.all([
    // Unique view count
    viewsColl
      .aggregate<{ uniqueCount: number }>([
        { $match: { profileId: oid } },
        {
          $group: {
            _id: {
              $ifNull: [
                "$visitorKey",
                { $concat: ["$visitorIp", "|", { $ifNull: ["$userAgent", ""] }] },
              ],
            },
          },
        },
        { $count: "uniqueCount" },
      ])
      .toArray(),
    // Views this week (unique)
    viewsColl
      .aggregate<{ count: number }>([
        { $match: { profileId: oid, viewedAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: {
              $ifNull: [
                "$visitorKey",
                { $concat: ["$visitorIp", "|", { $ifNull: ["$userAgent", ""] }] },
              ],
            },
          },
        },
        { $count: "count" },
      ])
      .toArray(),
    // Views per day (last N days)
    viewsColl
      .aggregate<{ _id: string; count: number }>([
        { $match: { profileId: oid, viewedAt: { $gte: daysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    // Traffic sources (referrer domain → count)
    viewsColl
      .aggregate<{ _id: string | null; count: number }>([
        { $match: { profileId: oid } },
        { $group: { _id: "$referrerDomain", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ])
      .toArray(),
    // Device breakdown
    viewsColl
      .aggregate<{ _id: string; count: number }>([
        { $match: { profileId: oid } },
        { $group: { _id: { $ifNull: ["$deviceType", "unknown"] }, count: { $sum: 1 } } },
      ])
      .toArray(),
    // Country breakdown (from Cloudflare CF-IPCountry)
    viewsColl
      .aggregate<{ _id: string; count: number }>([
        { $match: { profileId: oid, countryCode: { $exists: true, $nin: [null, ""] } } },
        { $group: { _id: "$countryCode", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ])
      .toArray(),
    // Recent views (deduped by visitor, most recent first)
    viewsColl
      .find({ profileId: oid })
      .sort({ viewedAt: -1 })
      .limit(recentViewersLimit * 3)
      .toArray(),
  ]);

  const viewCount = uniqueResult[0]?.uniqueCount ?? 0;
  const viewsThisWeek = weekResult[0]?.count ?? 0;

  // Build views over time (fill gaps with 0)
  const viewsOverTimeMap = new Map<string, number>();
  for (const row of viewsOverTimeRaw) {
    viewsOverTimeMap.set(row._id, row.count);
  }
  const viewsOverTime: { date: string; count: number }[] = [];
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(daysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    viewsOverTime.push({ date: key, count: viewsOverTimeMap.get(key) ?? 0 });
  }

  // Traffic sources with human-readable labels
  const siteHost = getBaseDomain();
  const trafficSources = trafficRaw.map((r) => ({
    source: r._id ? referrerDomainToSource(r._id, siteHost) : "Direct",
    count: r.count,
  }));

  // Countries (from Cloudflare CF-IPCountry)
  const countries = countryRaw.map((r) => ({
    countryCode: r._id,
    count: r.count,
  }));

  // Device breakdown
  const deviceBreakdown = { desktop: 0, mobile: 0, bot: 0, unknown: 0 };
  for (const row of deviceRaw) {
    const k = row._id as keyof typeof deviceBreakdown;
    if (k in deviceBreakdown) deviceBreakdown[k] = row.count;
    else deviceBreakdown.unknown += row.count;
  }

  // Who viewed: dedupe by visitor, prefer viewerUserId for "who" when available
  const seen = new Set<string>();
  const whoRows: {
    id: string;
    viewedAt: Date;
    viewerUserId: string | null;
  }[] = [];
  for (const v of recentViews as { _id: ObjectId; visitorKey?: string; visitorIp: string; userAgent?: string | null; viewerUserId?: string | null; viewedAt: Date }[]) {
    const key = v.visitorKey ?? `${v.visitorIp}|${v.userAgent ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    whoRows.push({
      id: v._id.toString(),
      viewedAt: v.viewedAt,
      viewerUserId: v.viewerUserId ?? null,
    });
    if (whoRows.length >= recentViewersLimit) break;
  }

  // Enrich with viewer profiles
  const viewerUserIds = [...new Set(whoRows.map((r) => r.viewerUserId).filter(Boolean))] as string[];
  const viewerProfiles =
    viewerUserIds.length > 0
      ? await profilesColl
          .find({ userId: { $in: viewerUserIds } })
          .project({ userId: 1, slug: 1, name: 1, avatarUrl: 1 })
          .toArray()
      : [];
  const profileByUserId = new Map(
    (viewerProfiles as { userId: string; slug: string; name: string; avatarUrl?: string | null }[]).map(
      (p) => [p.userId, { slug: p.slug, name: p.name, avatarUrl: p.avatarUrl ?? null }]
    )
  );

  const whoViewed: ProfileViewerRow[] = whoRows.map((r) => ({
    id: r.id,
    viewedAt: r.viewedAt,
    viewerUserId: r.viewerUserId,
    viewerProfile: r.viewerUserId ? profileByUserId.get(r.viewerUserId) ?? null : null,
  }));

  return {
    viewCount,
    viewsThisWeek,
    viewsOverTime,
    trafficSources,
    deviceBreakdown,
    countries,
    whoViewed,
  };
}

export async function updateMemberProfile(
  profileId: string,
  userId: string,
  data: Record<string, unknown>
): Promise<ProfileRow> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    throw new Error("Profile not found or access denied");
  }
  const update: Record<string, unknown> = { ...data, updatedAt: new Date() };
  const result = await client.db(dbName).collection(COLLECTIONS.profiles).findOneAndUpdate(
    { _id: oid, userId },
    { $set: update },
    { returnDocument: "after" }
  );
  if (!result) throw new Error("Profile not found or access denied");
  return toProfileRow(result);
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

function parseAudioTracks(raw: string | null | undefined): { url: string; title?: string }[] | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return undefined;
    return arr
      .filter(
        (x): x is { url: string; title?: string } =>
          x && typeof x === "object" && typeof (x as { url?: unknown }).url === "string"
      )
      .map((x) => ({ url: (x as { url: string }).url.trim(), title: (x as { title?: string }).title?.trim() }))
      .filter((x) => x.url.length > 0);
  } catch {
    return undefined;
  }
}

export function memberProfileToProfile(
  row: ProfileRow,
  badgeFlags?: { verified: boolean; staff: boolean },
  discordBadgeData?: DiscordBadgeData | null,
  customBadgesList?: CustomBadge[],
  ownerHasPremium?: boolean
): Profile {
  const nameAnim = (row as { nameAnimation?: string | null }).nameAnimation ?? undefined;
  const taglineAnim = (row as { taglineAnimation?: string | null }).taglineAnimation ?? undefined;
  const descAnim = (row as { descriptionAnimation?: string | null }).descriptionAnimation ?? undefined;
  const bgEffect = (row as { backgroundEffect?: string | null }).backgroundEffect ?? undefined;
  const stripPremium = ownerHasPremium === false;
  const links = parseLinks(row.links ?? null);
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
    terminalCommands: parseTerminalCommands(row.terminalCommands ?? null),
    easterEgg: row.easterEgg ?? undefined,
    easterEggTaglineWord: row.easterEggTaglineWord ?? undefined,
    easterEggLink,
    links,
    ogImageUrl: row.ogImageUrl ?? undefined,
    updatedAt: undefined,
    accentColor: stripPremium ? undefined : (row.accentColor ?? undefined),
    customTextColor: stripPremium ? undefined : ((row as { customTextColor?: string | null }).customTextColor ?? undefined),
    customBackgroundColor: stripPremium ? undefined : ((row as { customBackgroundColor?: string | null }).customBackgroundColor ?? undefined),
    terminalPrompt: row.terminalPrompt ?? undefined,
    nameGreeting: row.nameGreeting ?? undefined,
    cardStyle: row.cardStyle ?? undefined,
    cardOpacity: row.cardOpacity ?? undefined,
    cardBlur: (() => {
      const b = (row as { cardBlur?: string | null }).cardBlur;
      return b && ["none", "sm", "md", "lg"].includes(b) ? (b as "none" | "sm" | "md" | "lg") : undefined;
    })(),
    pageTheme: (() => {
      const t = (row.pageTheme ?? "") as string;
      if (t === "classic") return "classic-dark" as const;
      if (t === "minimalist") return "minimalist-light" as const;
      if (["classic-dark", "classic-light", "minimalist-light", "minimalist-dark"].includes(t)) return t as "classic-dark" | "classic-light" | "minimalist-light" | "minimalist-dark";
      return "classic-dark" as const;
    })(),
    pronouns: row.pronouns ?? undefined,
    location: row.location ?? undefined,
    timezone: row.timezone ?? undefined,
    timezoneRange: row.timezoneRange ?? undefined,
    birthday: row.birthday ?? undefined,
    websiteUrl: row.websiteUrl ?? undefined,
    skills: row.skills ?? undefined,
    languages: row.languages ?? undefined,
    availability: row.availability ?? undefined,
    currentFocus: row.currentFocus ?? undefined,
    avatarShape: row.avatarShape ?? undefined,
    layoutDensity: row.layoutDensity ?? undefined,
    customFont: row.customFont ?? undefined,
    customFontUrl: row.customFontUrl ?? undefined,
    cursorStyle: row.cursorStyle ?? undefined,
    cursorImageUrl: row.cursorImageUrl ?? undefined,
    animationPreset: row.animationPreset ?? undefined,
    nameAnimation: stripPremium && isPremiumNameAnimation(nameAnim) ? undefined : (nameAnim ?? undefined),
    taglineAnimation: stripPremium && isPremiumFieldAnimation(taglineAnim) ? undefined : (taglineAnim ?? undefined),
    descriptionAnimation: stripPremium && isPremiumFieldAnimation(descAnim) ? undefined : (descAnim ?? undefined),
    backgroundType: (() => {
      const t = row.backgroundType ?? undefined;
      if (t === "audio") return undefined;
      return t;
    })(),
    backgroundUrl: (() => {
      const t = row.backgroundType ?? undefined;
      if (t === "audio") return undefined;
      return row.backgroundUrl ?? undefined;
    })(),
    backgroundAudioUrl: row.backgroundAudioUrl ?? (row.backgroundType === "audio" ? row.backgroundUrl ?? undefined : undefined),
    backgroundEffect: stripPremium && isPremiumBackgroundEffect(bgEffect) ? undefined : (bgEffect ?? undefined),
    widgetsMatchAccent: (row as { widgetsMatchAccent?: boolean | null }).widgetsMatchAccent ?? false,
    unlockOverlayText: (row as { unlockOverlayText?: string | null }).unlockOverlayText ?? undefined,
    noindex: row.noindex ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    showPageViews: row.showPageViews ?? true,
    showAudioPlayer: row.showAudioPlayer ?? undefined,
    audioVisualizerStyle: (() => {
      const s = row.audioVisualizerStyle ?? undefined;
      const map: Record<string, string> = { waveform: "wave", circle: "bars", line: "bars", blocks: "bars" };
      const resolved = map[s ?? ""] ?? s;
      return ["bars", "wave", "spectrum"].includes(resolved ?? "") ? resolved : undefined;
    })(),
    audioVisualizerAnimation: (() => {
      const a = row.audioVisualizerAnimation ?? undefined;
      return a && ["smooth", "bounce", "glow", "pulse"].includes(a) ? a : undefined;
    })(),
    audioTracks: parseAudioTracks(row.audioTracks ?? null),
    ...(badgeFlags && {
      verified: badgeFlags.verified || undefined,
      staff: badgeFlags.staff || undefined,
    }),
    ...(ownerHasPremium === true && { premium: true }),
    ...(customBadgesList &&
      customBadgesList.length > 0 && {
        customBadges: customBadgesList.map((b) => ({
          id: b.id,
          key: b.key,
          label: b.label,
          description: b.description ?? undefined,
          color: b.color ?? undefined,
          sortOrder: b.sortOrder,
          badgeType: b.badgeType ?? undefined,
          imageUrl: b.imageUrl ?? undefined,
          iconName: b.iconName ?? undefined,
        })),
      }),
    ...(row.showDiscordBadges &&
      discordBadgeData &&
      (discordBadgeData.flags != null || discordBadgeData.premiumType != null) && {
        discordBadges: (() => {
          const all = [
            ...decodeDiscordPublicFlags(discordBadgeData.flags ?? 0),
            ...getPremiumBadgeKeys(discordBadgeData.premiumType),
          ];
          const hiddenRaw = (row as { hiddenDiscordBadges?: string | null }).hiddenDiscordBadges?.trim();
          if (!hiddenRaw) return all;
          const hidden = new Set(
            hiddenRaw
              .split(",")
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean)
          );
          return all.filter((key) => !hidden.has(key.toLowerCase()));
        })(),
      }),
    ...(row.discordPresenceStyle && {
      discordPresenceStyle: row.discordPresenceStyle,
    }),
  };
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  sortOrder: number;
}

export async function getGalleryForProfile(profileId: string): Promise<GalleryItem[]> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return [];
  }
  const docs = await client
    .db(dbName)
    .collection(COLLECTIONS.galleryItems)
    .find({ profileId: oid })
    .sort({ sortOrder: 1 })
    .toArray();
  return docs.map((d) => ({
    id: d._id.toString(),
    imageUrl: d.imageUrl,
    title: d.title ?? undefined,
    description: d.description ?? undefined,
    sortOrder: d.sortOrder,
  }));
}

async function ensureProfileOwnership(profileId: string, userId: string): Promise<void> {
  const profile = await getMemberProfileById(profileId);
  if (!profile || profile.userId !== userId) throw new Error("Profile not found or access denied");
}

export async function addGalleryItem(
  profileId: string,
  userId: string,
  data: { imageUrl: string; title?: string | null; description?: string | null }
): Promise<GalleryItem> {
  await ensureProfileOwnership(profileId, userId);

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    throw new Error("Invalid profile");
  }

  const agg = await db
    .collection(COLLECTIONS.galleryItems)
    .aggregate([{ $match: { profileId: oid } }, { $group: { _id: null, max: { $max: "$sortOrder" } } }])
    .toArray();
  const sortOrder = (agg[0]?.max ?? -1) + 1;

  const doc = {
    _id: new ObjectId(),
    profileId: oid,
    imageUrl: data.imageUrl.trim().slice(0, 2048),
    title: data.title?.trim().slice(0, 200) ?? null,
    description: data.description?.trim().slice(0, 1000) ?? null,
    sortOrder,
  };
  await db.collection(COLLECTIONS.galleryItems).insertOne(doc);
  return {
    id: doc._id.toString(),
    imageUrl: doc.imageUrl,
    title: doc.title ?? undefined,
    description: doc.description ?? undefined,
    sortOrder: doc.sortOrder,
  };
}

export async function updateGalleryItem(
  itemId: string,
  userId: string,
  data: { title?: string | null; description?: string | null }
): Promise<GalleryItem> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  let oid: ObjectId;
  try {
    oid = new ObjectId(itemId);
  } catch {
    throw new Error("Gallery item not found");
  }
  const item = await db.collection(COLLECTIONS.galleryItems).findOne({ _id: oid });
  if (!item) throw new Error("Gallery item not found");
  await ensureProfileOwnership(item.profileId.toString(), userId);

  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title?.trim().slice(0, 200) ?? null;
  if (data.description !== undefined) update.description = data.description?.trim().slice(0, 1000) ?? null;
  if (Object.keys(update).length === 0) {
    return {
      id: item._id.toString(),
      imageUrl: item.imageUrl,
      title: item.title ?? undefined,
      description: item.description ?? undefined,
      sortOrder: item.sortOrder,
    };
  }

  const result = await db.collection(COLLECTIONS.galleryItems).findOneAndUpdate(
    { _id: oid },
    { $set: update },
    { returnDocument: "after" }
  );
  if (!result) throw new Error("Update failed");
  return {
    id: result._id.toString(),
    imageUrl: result.imageUrl,
    title: result.title ?? undefined,
    description: result.description ?? undefined,
    sortOrder: result.sortOrder,
  };
}

export async function deleteGalleryItem(itemId: string, userId: string): Promise<void> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  let oid: ObjectId;
  try {
    oid = new ObjectId(itemId);
  } catch {
    throw new Error("Gallery item not found");
  }
  const item = await db.collection(COLLECTIONS.galleryItems).findOne({ _id: oid });
  if (!item) throw new Error("Gallery item not found");
  await ensureProfileOwnership(item.profileId.toString(), userId);
  await db.collection(COLLECTIONS.galleryItems).deleteOne({ _id: oid });
}

/** Replace all gallery items for a profile. Deletes existing and adds new ones. */
export async function replaceGalleryItems(
  profileId: string,
  userId: string,
  items: { imageUrl: string; title?: string | null; description?: string | null }[]
): Promise<void> {
  await ensureProfileOwnership(profileId, userId);

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    throw new Error("Invalid profile");
  }

  await db.collection(COLLECTIONS.galleryItems).deleteMany({ profileId: oid });
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const imageUrl = item.imageUrl?.trim().slice(0, 2048);
    if (!imageUrl) continue;
    await db.collection(COLLECTIONS.galleryItems).insertOne({
      _id: new ObjectId(),
      profileId: oid,
      imageUrl,
      title: item.title?.trim().slice(0, 200) ?? null,
      description: item.description?.trim().slice(0, 1000) ?? null,
      sortOrder: i,
    });
  }
}

export async function setGalleryOrder(profileId: string, userId: string, orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  await ensureProfileOwnership(profileId, userId);

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    throw new Error("Invalid profile");
  }

  const updates = orderedIds.map((id, index) =>
    db
      .collection(COLLECTIONS.galleryItems)
      .updateOne({ _id: new ObjectId(id), profileId: oid }, { $set: { sortOrder: index } })
  );
  await Promise.all(updates);
}

const SHORT_LINK_SLUG_MAX = 64;
function normalizeShortLinkSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SHORT_LINK_SLUG_MAX) || "";
}

export async function getShortLinkRedirect(
  profileSlug: string,
  linkSlug: string
): Promise<{ url: string } | null> {
  const slug = normalizeShortLinkSlug(linkSlug);
  if (!slug) return null;

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);

  const profile = await db.collection(COLLECTIONS.profiles).findOne({ slug: profileSlug }, { projection: { _id: 1 } });
  if (!profile) return null;

  const link = await db.collection(COLLECTIONS.profileShortLinks).findOne({
    profileId: profile._id,
    slug,
  });
  return link ? { url: link.url } : null;
}

export interface ProfileShortLink {
  id: string;
  slug: string;
  url: string;
}

export async function getShortLinksForProfile(profileId: string): Promise<ProfileShortLink[]> {
  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    return [];
  }
  const docs = await client
    .db(dbName)
    .collection(COLLECTIONS.profileShortLinks)
    .find({ profileId: oid })
    .sort({ slug: 1 })
    .toArray();
  return docs.map((d) => ({ id: d._id.toString(), slug: d.slug, url: d.url }));
}

export async function addShortLink(
  profileId: string,
  userId: string,
  data: { slug: string; url: string }
): Promise<ProfileShortLink> {
  await ensureProfileOwnership(profileId, userId);
  const slug = normalizeShortLinkSlug(data.slug);
  if (!slug) throw new Error("Slug is required (letters, numbers, hyphen, underscore)");
  const url = data.url?.trim();
  if (!url) throw new Error("URL is required");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error("URL must start with http:// or https://");
  }

  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    throw new Error("Invalid profile");
  }

  try {
    const doc = {
      _id: new ObjectId(),
      profileId: oid,
      slug,
      url: url.slice(0, 2048),
    };
    await client.db(dbName).collection(COLLECTIONS.profileShortLinks).insertOne(doc);
    return { id: doc._id.toString(), slug: doc.slug, url: doc.url };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      throw new Error("A link with this slug already exists");
    }
    throw err;
  }
}

export async function deleteShortLink(linkId: string, userId: string): Promise<void> {
  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  let oid: ObjectId;
  try {
    oid = new ObjectId(linkId);
  } catch {
    throw new Error("Short link not found");
  }
  const link = await db.collection(COLLECTIONS.profileShortLinks).findOne({ _id: oid });
  if (!link) throw new Error("Short link not found");
  await ensureProfileOwnership(link.profileId.toString(), userId);
  await db.collection(COLLECTIONS.profileShortLinks).deleteOne({ _id: oid });
}

/** Replace all short links for a profile. Deletes existing and adds new ones. */
export async function replaceShortLinks(
  profileId: string,
  userId: string,
  links: { slug: string; url: string }[]
): Promise<void> {
  await ensureProfileOwnership(profileId, userId);

  const client = await getDb();
  const dbName = await getDbName();
  let oid: ObjectId;
  try {
    oid = new ObjectId(profileId);
  } catch {
    throw new Error("Invalid profile");
  }

  await client.db(dbName).collection(COLLECTIONS.profileShortLinks).deleteMany({ profileId: oid });
  for (const link of links) {
    const slug = normalizeShortLinkSlug(link.slug);
    const url = link.url?.trim();
    if (!slug || !url?.startsWith("http")) continue;
    try {
      await client.db(dbName).collection(COLLECTIONS.profileShortLinks).insertOne({
        _id: new ObjectId(),
        profileId: oid,
        slug,
        url: url.slice(0, 2048),
      });
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
        continue;
      }
      throw err;
    }
  }
}
