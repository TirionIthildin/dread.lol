/**
 * User-created badges: purchasable addon lets users design their own badge.
 * One badge per user, stored in user_created_badges.
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
}

export async function getUserCreatedBadge(userId: string): Promise<UserCreatedBadge | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection(COLLECTIONS.userCreatedBadges)
    .findOne({ userId });
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    label: doc.label ?? "",
    description: doc.description ?? null,
    color: doc.color ?? null,
    badgeType: (doc.badgeType as "label" | "image" | "icon") ?? "label",
    imageUrl: doc.imageUrl ?? null,
    iconName: doc.iconName ?? null,
    sortOrder: doc.sortOrder ?? 999,
  };
}

export async function upsertUserCreatedBadge(
  userId: string,
  data: {
    label: string;
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

  const update = {
    userId,
    label: data.label.trim().slice(0, 50),
    description: (data.description?.trim() ?? "").slice(0, 200) || null,
    color: (data.color?.trim() ?? "").slice(0, 20) || null,
    badgeType: data.badgeType ?? "label",
    imageUrl: (data.imageUrl?.trim() ?? "").slice(0, 500) || null,
    iconName: (data.iconName?.trim() ?? "").slice(0, 100) || null,
    sortOrder: 999,
    updatedAt: now,
  };

  const doc = await coll.findOneAndUpdate(
    { userId },
    { $set: update, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after" }
  );

  if (!doc || !doc._id) return null;
  const d = doc as { _id: ObjectId; userId: string } & typeof update;
  return {
    id: d._id.toString(),
    userId: d.userId,
    label: d.label,
    description: d.description,
    color: d.color,
    badgeType: d.badgeType as "label" | "image" | "icon",
    imageUrl: d.imageUrl,
    iconName: d.iconName,
    sortOrder: d.sortOrder,
  };
}
