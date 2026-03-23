/**
 * Profile micro-blog: markdown posts per profile.
 */
import { ObjectId } from "mongodb";
import { getDb, getDbName, COLLECTIONS, type BlogPostDoc, type BlogPostRow } from "@/lib/db";
import { getMemberProfileById } from "@/lib/member-profiles";

const MAX_CONTENT_BYTES = 128 * 1024; // 128KB
const MAX_TITLE_LENGTH = 200;

function toBlogPostRow(doc: BlogPostDoc): BlogPostRow {
  return {
    id: doc._id.toString(),
    profileId: doc.profileId.toString(),
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function ensureProfileOwnership(profileId: string, userId: string): Promise<void> {
  const profile = await getMemberProfileById(profileId);
  if (!profile || profile.userId !== userId) throw new Error("Profile not found or access denied");
}

/** List blog posts for a profile (public). Newest first. */
export async function getBlogPostsForProfile(profileId: string, limit = 50): Promise<BlogPostRow[]> {
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
    .collection<BlogPostDoc>(COLLECTIONS.blogPosts)
    .find({ profileId: oid })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toBlogPostRow);
}

/** Get a single blog post by id (public). */
export async function getBlogPost(postId: string): Promise<BlogPostRow | null> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(postId);
  } catch {
    return null;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection<BlogPostDoc>(COLLECTIONS.blogPosts)
    .findOne({ _id: oid });
  return doc ? toBlogPostRow(doc) : null;
}

/** Create a blog post. Requires profile ownership. */
export async function createBlogPost(
  profileId: string,
  userId: string,
  data: { title: string; content: string }
): Promise<BlogPostRow> {
  await ensureProfileOwnership(profileId, userId);

  const title = data.title?.trim().slice(0, MAX_TITLE_LENGTH) || "Untitled";
  const content = (data.content ?? "").trim();
  if (!content) throw new Error("Content is required");

  const encoder = new TextEncoder();
  if (encoder.encode(content).length > MAX_CONTENT_BYTES) {
    throw new Error(`Content exceeds ${MAX_CONTENT_BYTES / 1024}KB limit`);
  }

  let profileOid: ObjectId;
  try {
    profileOid = new ObjectId(profileId);
  } catch {
    throw new Error("Invalid profile");
  }

  const client = await getDb();
  const dbName = await getDbName();
  const now = new Date();
  const doc: BlogPostDoc = {
    _id: new ObjectId(),
    profileId: profileOid,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
  await client.db(dbName).collection<BlogPostDoc>(COLLECTIONS.blogPosts).insertOne(doc);
  return toBlogPostRow(doc);
}

/** Update a blog post. Requires profile ownership. */
export async function updateBlogPost(
  postId: string,
  userId: string,
  data: { title?: string; content?: string }
): Promise<BlogPostRow | null> {
  const existing = await getBlogPost(postId);
  if (!existing) return null;
  await ensureProfileOwnership(existing.profileId, userId);

  const title =
    data.title !== undefined
      ? (data.title?.trim().slice(0, MAX_TITLE_LENGTH) || "Untitled")
      : undefined;
  let content: string | undefined;
  if (data.content !== undefined) {
    const c = (data.content ?? "").trim();
    if (!c) throw new Error("Content cannot be empty");
    const encoder = new TextEncoder();
    if (encoder.encode(c).length > MAX_CONTENT_BYTES) {
      throw new Error(`Content exceeds ${MAX_CONTENT_BYTES / 1024}KB limit`);
    }
    content = c;
  }

  if (title === undefined && content === undefined) return existing;

  const client = await getDb();
  const dbName = await getDbName();
  const update: Partial<BlogPostDoc> = { updatedAt: new Date() };
  if (title !== undefined) update.title = title;
  if (content !== undefined) update.content = content;

  let oid: ObjectId;
  try {
    oid = new ObjectId(postId);
  } catch {
    return null;
  }

  const result = await client
    .db(dbName)
    .collection<BlogPostDoc>(COLLECTIONS.blogPosts)
    .findOneAndUpdate({ _id: oid }, { $set: update }, { returnDocument: "after" });

  return result ? toBlogPostRow(result) : null;
}

/** Delete a blog post. Requires profile ownership. */
export async function deleteBlogPost(postId: string, userId: string): Promise<boolean> {
  const existing = await getBlogPost(postId);
  if (!existing) return false;
  await ensureProfileOwnership(existing.profileId, userId);

  let oid: ObjectId;
  try {
    oid = new ObjectId(postId);
  } catch {
    return false;
  }

  const client = await getDb();
  const dbName = await getDbName();
  const res = await client
    .db(dbName)
    .collection<BlogPostDoc>(COLLECTIONS.blogPosts)
    .deleteOne({ _id: oid });
  return res.deletedCount === 1;
}
