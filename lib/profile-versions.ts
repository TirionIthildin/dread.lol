/**
 * Profile versions: save and restore up to 5 snapshots of a user's profile.
 * Includes profile data, gallery items, and short links. Copies /api/files/ assets
 * so each version is self-contained.
 */
import { ObjectId } from "mongodb";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { ProfileRow } from "@/lib/db/schema";
import {
  getMemberProfileById,
  getGalleryForProfile,
  getShortLinksForProfile,
  updateMemberProfile,
  replaceGalleryItems,
  replaceShortLinks,
} from "@/lib/member-profiles";
import { copyFile } from "@/lib/file-storage";

const MAX_VERSIONS_PER_USER = 5;

/** Profile fields we snapshot (excludes userId, slug, createdAt, updatedAt). */
type ProfileSnapshotData = Omit<
  ProfileRow,
  "id" | "userId" | "slug" | "createdAt" | "updatedAt"
>;

export interface ProfileVersionDoc {
  _id: ObjectId;
  userId: string;
  profileId: ObjectId;
  name: string;
  data: ProfileSnapshotData;
  gallery: { imageUrl: string; title?: string | null; description?: string | null }[];
  shortLinks: { slug: string; url: string }[];
  createdAt: Date;
}

export interface ProfileVersionRow {
  id: string;
  name: string;
  createdAt: Date;
}

/** Extract profile fields for snapshot (excludes identity fields). */
function profileToSnapshotData(profile: ProfileRow): ProfileSnapshotData {
  const {
    id: _id,
    userId: _userId,
    slug: _slug,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...data
  } = profile;
  return data as ProfileSnapshotData;
}

/** Save current profile state as a new version. Copies assets. */
export async function saveProfileVersion(
  userId: string,
  profileId: string,
  name: string
): Promise<{ id: string } | { error: string }> {
  const profile = await getMemberProfileById(profileId);
  if (!profile || profile.userId !== userId) {
    return { error: "Profile not found or access denied" };
  }

  const [gallery, shortLinks] = await Promise.all([
    getGalleryForProfile(profileId),
    getShortLinksForProfile(profileId),
  ]);

  const trimmedName = name.trim().slice(0, 80) || "Untitled";

  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection<ProfileVersionDoc>(COLLECTIONS.profileVersions);

  const count = await coll.countDocuments({ userId });
  if (count >= MAX_VERSIONS_PER_USER) {
    const oldest = await coll
      .find({ userId })
      .sort({ createdAt: 1 })
      .limit(1)
      .toArray();
    if (oldest.length > 0) {
      await coll.deleteOne({ _id: oldest[0]._id });
    }
  }

  const profileOid = new ObjectId(profileId);

  const urlKeys = [
    "avatarUrl",
    "banner",
    "ogImageUrl",
    "backgroundUrl",
    "backgroundAudioUrl",
    "customFontUrl",
    "cursorImageUrl",
  ] as const;

  let data = profileToSnapshotData(profile);
  for (const key of urlKeys) {
    const val = (data as Record<string, unknown>)[key];
    if (typeof val === "string" && val.trim().startsWith("/api/files/")) {
      const copied = await copyFile(val.trim());
      (data as Record<string, unknown>)[key] = copied ?? val;
    }
  }

  if (data.audioTracks && typeof data.audioTracks === "string") {
    try {
      const arr = JSON.parse(data.audioTracks) as unknown;
      if (Array.isArray(arr)) {
        const mapped = await Promise.all(
          arr.map(
            async (x: { url?: string; title?: string }) => {
              if (x?.url?.trim().startsWith("/api/files/")) {
                const copied = await copyFile(x.url);
                return { ...x, url: copied ?? x.url };
              }
              return x;
            }
          )
        );
        data = { ...data, audioTracks: JSON.stringify(mapped) } as ProfileSnapshotData;
      }
    } catch {
      /* keep original */
    }
  }

  const galleryWithCopiedUrls = await Promise.all(
    gallery.map(async (g) => {
      if (g.imageUrl?.trim().startsWith("/api/files/")) {
        const copied = await copyFile(g.imageUrl);
        return { ...g, imageUrl: copied ?? g.imageUrl };
      }
      return g;
    })
  );

  const doc: ProfileVersionDoc = {
    _id: new ObjectId(),
    userId,
    profileId: profileOid,
    name: trimmedName,
    data,
    gallery: galleryWithCopiedUrls.map((g) => ({
      imageUrl: g.imageUrl,
      title: g.title ?? null,
      description: g.description ?? null,
    })),
    shortLinks: shortLinks.map((l) => ({ slug: l.slug, url: l.url })),
    createdAt: new Date(),
  };

  await coll.insertOne(doc);
  return { id: doc._id.toString() };
}

/** List versions for a user, newest first. */
export async function getProfileVersions(userId: string): Promise<ProfileVersionRow[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection<ProfileVersionDoc>(COLLECTIONS.profileVersions)
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(MAX_VERSIONS_PER_USER)
    .toArray();

  return docs.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    createdAt: d.createdAt,
  }));
}

/** Restore a version to the user's profile. */
export async function restoreProfileVersion(
  userId: string,
  versionId: string
): Promise<{ error?: string }> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(versionId);
  } catch {
    return { error: "Invalid version" };
  }

  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection<ProfileVersionDoc>(COLLECTIONS.profileVersions);

  const doc = await coll.findOne({ _id: oid, userId });
  if (!doc) return { error: "Version not found" };

  const profile = await getMemberProfileById(doc.profileId.toString());
  if (!profile || profile.userId !== userId) {
    return { error: "Profile not found or access denied" };
  }

  const update: Record<string, unknown> = { ...doc.data, updatedAt: new Date() };
  delete update._id;
  delete update.userId;
  delete update.slug;
  delete update.createdAt;

  await updateMemberProfile(doc.profileId.toString(), userId, update);
  await replaceGalleryItems(
    doc.profileId.toString(),
    userId,
    doc.gallery.map((g) => ({
      imageUrl: g.imageUrl,
      title: g.title ?? null,
      description: g.description ?? null,
    }))
  );
  await replaceShortLinks(doc.profileId.toString(), userId, doc.shortLinks);

  return {};
}

/** Delete a version. */
export async function deleteProfileVersion(
  userId: string,
  versionId: string
): Promise<{ error?: string }> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(versionId);
  } catch {
    return { error: "Invalid version" };
  }

  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.profileVersions)
    .deleteOne({ _id: oid, userId });

  if (result.deletedCount === 0) return { error: "Version not found" };
  return {};
}
