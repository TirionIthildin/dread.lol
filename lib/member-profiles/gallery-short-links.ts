import { ObjectId } from "mongodb";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { normalizeSlug } from "@/lib/slug";
import { getMemberProfileById } from "./core";
import { resolveMemberProfileBySlug } from "./profile-aliases";
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

  const normalizedProfileSlug = normalizeSlug(profileSlug) || profileSlug;
  const resolved = await resolveMemberProfileBySlug(normalizedProfileSlug);
  if (!resolved) return null;
  let oid: ObjectId;
  try {
    oid = new ObjectId(resolved.profile.id);
  } catch {
    return null;
  }
  const profile = { _id: oid };

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
