/**
 * Paste service: text storage with short URLs. Requires login.
 */
import { ObjectId } from "mongodb";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { randomBytes } from "crypto";

const SLUG_LENGTH = 8;
const MAX_CONTENT_BYTES = 1024 * 1024; // 1MB

function generateSlug(): string {
  return randomBytes(Math.ceil((SLUG_LENGTH * 3) / 4))
    .toString("base64url")
    .slice(0, SLUG_LENGTH);
}

export interface PasteDoc {
  _id: ObjectId;
  slug: string;
  content: string;
  language: string | null;
  userId: string;
  authorSlug: string | null;
  authorName: string | null;
  createdAt: Date;
}

export interface PasteResult {
  id: string;
  slug: string;
  url: string;
}

export async function createPaste(data: {
  content: string;
  language?: string | null;
  userId: string;
  authorSlug?: string | null;
  authorName?: string | null;
}): Promise<PasteResult> {
  const content = data.content?.trim();
  if (!content) throw new Error("Content is required");
  if (!data.userId) throw new Error("Authentication required");

  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  if (bytes.length > MAX_CONTENT_BYTES) {
    throw new Error(`Content exceeds ${MAX_CONTENT_BYTES / 1024}KB limit`);
  }

  const language = data.language?.trim().slice(0, 32) || null;
  const authorSlug = data.authorSlug?.trim().slice(0, 64) || null;
  const authorName = data.authorName?.trim().slice(0, 128) || null;

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const pastes = db.collection<PasteDoc>(COLLECTIONS.pastes);

  let slug: string;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    slug = generateSlug().toLowerCase();
    try {
      const doc: PasteDoc = {
        _id: new ObjectId(),
        slug,
        content,
        language,
        userId: data.userId,
        authorSlug,
        authorName,
        createdAt: new Date(),
      };
      await pastes.insertOne(doc);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dread.lol";
      return {
        id: doc._id.toString(),
        slug,
        url: `${baseUrl}/p/${slug}`,
      };
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
        attempts++;
        continue;
      }
      throw err;
    }
  }

  throw new Error("Failed to generate unique paste ID");
}

export interface PasteView {
  content: string;
  language: string | null;
  createdAt: Date;
  authorSlug: string | null;
  authorName: string | null;
}

export interface PasteListItem {
  slug: string;
  url: string;
  preview: string;
  language: string | null;
  createdAt: Date;
}

export async function listPastesByUserId(userId: string): Promise<PasteListItem[]> {
  if (!userId) return [];

  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection<PasteDoc>(COLLECTIONS.pastes)
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dread.lol";
  return docs.map((d) => ({
    slug: d.slug,
    url: `${baseUrl}/p/${d.slug}`,
    preview: d.content.slice(0, 80).replace(/\n/g, " ").trim(),
    language: d.language ?? null,
    createdAt: d.createdAt,
  }));
}

export async function updatePaste(
  slug: string,
  userId: string,
  data: { content?: string; language?: string | null }
): Promise<boolean> {
  const s = slug?.trim().slice(0, 64);
  if (!s || !userId) return false;

  const content = data.content !== undefined ? data.content?.trim() : undefined;
  if (content !== undefined && content === "") return false;
  if (content !== undefined && new TextEncoder().encode(content).length > MAX_CONTENT_BYTES)
    return false;

  const language = data.language !== undefined ? (data.language?.trim().slice(0, 32) || null) : undefined;
  const update: Partial<PasteDoc> = {};
  if (content !== undefined) update.content = content;
  if (language !== undefined) update.language = language;
  if (Object.keys(update).length === 0) return true;

  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection<PasteDoc>(COLLECTIONS.pastes)
    .updateOne(
      { slug: { $regex: `^${escapeRegex(s)}$`, $options: "i" }, userId },
      { $set: update }
    );

  return result.matchedCount > 0;
}

export async function deletePaste(slug: string, userId: string): Promise<boolean> {
  const s = slug?.trim().slice(0, 64);
  if (!s || !userId) return false;

  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection<PasteDoc>(COLLECTIONS.pastes)
    .deleteOne({ slug: { $regex: `^${escapeRegex(s)}$`, $options: "i" }, userId });

  return result.deletedCount > 0;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getPaste(slug: string): Promise<PasteView | null> {
  const s = slug?.trim().slice(0, 64);
  if (!s) return null;

  const client = await getDb();
  const dbName = await getDbName();
  // Case-insensitive lookup: pastes may have been stored with mixed-case base64url slugs
  const doc = await client
    .db(dbName)
    .collection<PasteDoc>(COLLECTIONS.pastes)
    .findOne({ slug: { $regex: `^${escapeRegex(s)}$`, $options: "i" } });

  if (!doc) return null;

  return {
    content: doc.content,
    language: doc.language ?? null,
    createdAt: doc.createdAt,
    authorSlug: doc.authorSlug ?? null,
    authorName: doc.authorName ?? null,
  };
}
