/**
 * User-created badges: purchasable addon lets users design their own badges.
 * Each purchase = one badge slot. Multiple badges per user.
 */
import { ObjectId } from "mongodb";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

export interface UserCreatedBadge {
  id: string;
  userId: string;
  label: string;
  description?: string | null;
  color?: string | null;
  badgeType?: "label" | "image" | "icon";
  imageUrl?: string | null;
  iconName?: string | null;
  sortOrder: number;
  creatorProgram?: boolean;
}

function docToBadge(doc: {
  _id: ObjectId;
  userId?: string;
  label?: string;
  description?: string | null;
  color?: string | null;
  badgeType?: string;
  imageUrl?: string | null;
  iconName?: string | null;
  sortOrder?: number;
  creatorProgram?: boolean;
}): UserCreatedBadge {
  return {
    id: doc._id.toString(),
    userId: doc.userId ?? "",
    label: doc.label ?? "",
    description: doc.description ?? null,
    color: doc.color ?? null,
    badgeType: (doc.badgeType as "label" | "image" | "icon") ?? "label",
    imageUrl: doc.imageUrl ?? null,
    iconName: doc.iconName ?? null,
    sortOrder: doc.sortOrder ?? 999,
    creatorProgram: doc.creatorProgram === true ? true : undefined,
  };
}

export async function isCreatorProgramBadge(userId: string, badgeId: string): Promise<boolean> {
  try {
    const client = await getDb();
    const dbName = await getDbName();
    const doc = await client
      .db(dbName)
      .collection(COLLECTIONS.userCreatedBadges)
      .findOne({ _id: new ObjectId(badgeId), userId, creatorProgram: true }, { projection: { _id: 1 } });
    return doc !== null;
  } catch {
    return false;
  }
}

/** The single Verified Creator program badge for this user, if any. */
export async function getCreatorProgramBadge(userId: string): Promise<UserCreatedBadge | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection(COLLECTIONS.userCreatedBadges)
    .findOne({ userId, creatorProgram: true });
  if (!doc?._id) return null;
  return docToBadge(doc as Parameters<typeof docToBadge>[0]);
}

export async function getUserCreatedBadges(userId: string): Promise<UserCreatedBadge[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection(COLLECTIONS.userCreatedBadges)
    .find({ userId })
    .sort({ sortOrder: 1, _id: 1 })
    .toArray();
  return docs.map((d) => docToBadge(d));
}

export async function createUserCreatedBadge(
  userId: string,
  data: {
    label: string;
    description?: string | null;
    color?: string | null;
    badgeType?: "label" | "image" | "icon";
    imageUrl?: string | null;
    iconName?: string | null;
    /** Set only by Verified Creator API; marks the single program badge. */
    creatorProgram?: boolean;
  }
): Promise<UserCreatedBadge | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection(COLLECTIONS.userCreatedBadges);
  const now = new Date();

  const doc: {
    userId: string;
    label: string;
    description: string | null;
    color: string | null;
    badgeType: string;
    imageUrl: string | null;
    iconName: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    creatorProgram?: true;
  } = {
    userId,
    label: data.label.trim().slice(0, 50),
    description: (data.description?.trim() ?? "").slice(0, 200) || null,
    color: (data.color?.trim() ?? "").slice(0, 20) || null,
    badgeType: data.badgeType ?? "label",
    imageUrl: (data.imageUrl?.trim() ?? "").slice(0, 500) || null,
    iconName: (data.iconName?.trim() ?? "").slice(0, 100) || null,
    sortOrder: 999,
    createdAt: now,
    updatedAt: now,
  };
  if (data.creatorProgram === true) {
    doc.creatorProgram = true;
  }

  const result = await coll.insertOne(doc);
  if (!result.acknowledged) return null;
  return docToBadge({ _id: result.insertedId, ...doc });
}

export async function updateUserCreatedBadge(
  badgeId: string,
  userId: string,
  data: {
    label?: string;
    description?: string | null;
    color?: string | null;
    badgeType?: "label" | "image" | "icon";
    imageUrl?: string | null;
    iconName?: string | null;
  }
): Promise<UserCreatedBadge | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection(COLLECTIONS.userCreatedBadges);
  const now = new Date();

  const update: Record<string, unknown> = {
    updatedAt: now,
  };
  if (data.label !== undefined) update.label = data.label.trim().slice(0, 50);
  if (data.description !== undefined) update.description = (data.description?.trim() ?? "").slice(0, 200) || null;
  if (data.color !== undefined) update.color = (data.color?.trim() ?? "").slice(0, 20) || null;
  if (data.badgeType !== undefined) update.badgeType = data.badgeType;
  if (data.imageUrl !== undefined) update.imageUrl = (data.imageUrl?.trim() ?? "").slice(0, 500) || null;
  if (data.iconName !== undefined) update.iconName = (data.iconName?.trim() ?? "").slice(0, 100) || null;

  const doc = await coll.findOneAndUpdate(
    { _id: new ObjectId(badgeId), userId },
    { $set: update },
    { returnDocument: "after" }
  );
  if (!doc) return null;
  return docToBadge(doc as Parameters<typeof docToBadge>[0]);
}

export async function deleteUserCreatedBadge(badgeId: string, userId: string): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.userCreatedBadges)
    .deleteOne({ _id: new ObjectId(badgeId), userId });
  return result.deletedCount > 0;
}
