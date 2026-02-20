/**
 * Template favorites: users can save templates to "My favorites".
 */
import { ObjectId } from "mongodb";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

/** Add a template to user's favorites. Idempotent. */
export async function addTemplateFavorite(userId: string, templateId: string): Promise<{ error?: string }> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(templateId);
  } catch {
    return { error: "Invalid template" };
  }
  const client = await getDb();
  const dbName = await getDbName();
  await client
    .db(dbName)
    .collection(COLLECTIONS.templateFavorites)
    .updateOne(
      { userId, templateId: oid },
      { $setOnInsert: { userId, templateId: oid, createdAt: new Date() } },
      { upsert: true }
    );
  return {};
}

/** Remove a template from user's favorites. */
export async function removeTemplateFavorite(userId: string, templateId: string): Promise<boolean> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(templateId);
  } catch {
    return false;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.templateFavorites)
    .deleteOne({ userId, templateId: oid });
  return result.deletedCount > 0;
}

/** Check if user has favorited a template. */
export async function hasUserFavorited(userId: string, templateId: string): Promise<boolean> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(templateId);
  } catch {
    return false;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection(COLLECTIONS.templateFavorites)
    .findOne({ userId, templateId: oid });
  return !!doc;
}

/** Get favorite count for a template. */
export async function getTemplateFavoriteCount(templateId: string): Promise<number> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(templateId);
  } catch {
    return 0;
  }
  const client = await getDb();
  const dbName = await getDbName();
  return client
    .db(dbName)
    .collection(COLLECTIONS.templateFavorites)
    .countDocuments({ templateId: oid });
}

/** Get favorite counts for multiple templates. */
export async function getTemplateFavoriteCounts(
  templateIds: string[]
): Promise<Map<string, number>> {
  const oids: ObjectId[] = [];
  const idMap = new Map<string, ObjectId>();
  for (const id of templateIds) {
    try {
      const oid = new ObjectId(id);
      oids.push(oid);
      idMap.set(id, oid);
    } catch {
      // skip invalid
    }
  }
  if (oids.length === 0) return new Map();

  const client = await getDb();
  const dbName = await getDbName();
  const results = await client
    .db(dbName)
    .collection(COLLECTIONS.templateFavorites)
    .aggregate<{ _id: ObjectId; count: number }>([
      { $match: { templateId: { $in: oids } } },
      { $group: { _id: "$templateId", count: { $sum: 1 } } },
    ])
    .toArray();

  const revMap = new Map<string, string>();
  idMap.forEach((oid, id) => revMap.set(oid.toString(), id));
  const out = new Map<string, number>();
  for (const r of results) {
    const id = revMap.get(r._id.toString());
    if (id) out.set(id, r.count);
  }
  return out;
}

/** Get which of the given template IDs the user has favorited. */
export async function getFavoritedTemplateIds(userId: string, templateIds: string[]): Promise<Set<string>> {
  if (templateIds.length === 0) return new Set();
  const oids: ObjectId[] = [];
  for (const id of templateIds) {
    try {
      oids.push(new ObjectId(id));
    } catch {
      // skip
    }
  }
  if (oids.length === 0) return new Set();
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection(COLLECTIONS.templateFavorites)
    .find({ userId, templateId: { $in: oids } }, { projection: { templateId: 1 } })
    .toArray();
  return new Set(docs.map((d) => (d as unknown as { templateId: ObjectId }).templateId.toString()));
}

/** Get template IDs favorited by a user. */
export async function getFavoriteTemplateIds(userId: string): Promise<string[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection(COLLECTIONS.templateFavorites)
    .find({ userId }, { projection: { templateId: 1 } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => (d as unknown as { templateId: ObjectId }).templateId.toString());
}
