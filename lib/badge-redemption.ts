/**
 * Badge redemption links: shareable URLs to give a user-created badge.
 * Supports single-use (legacy) or multi-use with optional cap and expiry.
 * Per-user deduplication via badge_redemption_events.
 */
import { ObjectId } from "mongodb";
import crypto from "node:crypto";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { createUserCreatedBadge } from "@/lib/user-created-badge";
import type { BadgeRedemptionLinkDoc } from "@/lib/db/schema";

const TOKEN_BYTES = 24;
const TOKEN_LENGTH = 32; // base64url encoded

function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url").slice(0, TOKEN_LENGTH);
}

/** True if link uses legacy single-use semantics (usedAt/usedBy). */
function isLegacySingleUse(link: BadgeRedemptionLinkDoc): boolean {
  return link.maxRedemptions === undefined;
}

export async function createRedemptionLink(
  createdBy: string,
  badgeId: string,
  options?: { maxRedemptions?: number | null; expiresAt?: Date | null }
): Promise<{ url: string; token: string } | { error: string }> {
  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection(COLLECTIONS.badgeRedemptionLinks);
  const badgeColl = client.db(dbName).collection(COLLECTIONS.userCreatedBadges);

  const badgeObjId = new ObjectId(badgeId);
  const badge = await badgeColl.findOne({ _id: badgeObjId, userId: createdBy });
  if (!badge) {
    return { error: "Badge not found or you don't own it" };
  }

  const token = generateToken();
  const doc = {
    token,
    badgeId: badgeObjId,
    createdBy,
    usedAt: null as Date | null,
    usedBy: null as string | null,
    maxRedemptions: options?.maxRedemptions ?? null,
    expiresAt: options?.expiresAt ?? null,
    createdAt: new Date(),
  };

  await coll.insertOne(doc);
  const baseUrl = SITE_URL.replace(/\/$/, "");
  const url = `${baseUrl}/badge/redeem/${token}`;
  return { url, token };
}

/**
 * One canonical unlimited multi-use link for a Verified Creator program badge.
 * Drops extra links for the same badge so creators share a single URL.
 */
export async function ensureCreatorRedemptionLink(
  createdBy: string,
  badgeId: string
): Promise<{ url: string; token: string } | { error: string }> {
  const client = await getDb();
  const dbName = await getDbName();
  const badgeColl = client.db(dbName).collection(COLLECTIONS.userCreatedBadges);
  const badgeObjId = new ObjectId(badgeId);
  const badge = await badgeColl.findOne({ _id: badgeObjId, userId: createdBy, creatorProgram: true });
  if (!badge) {
    return { error: "Creator badge not found" };
  }

  const coll = client.db(dbName).collection(COLLECTIONS.badgeRedemptionLinks);
  const all = await coll.find({ badgeId: badgeObjId, createdBy }).sort({ createdAt: 1 }).toArray();
  const multiUnlimited = all.find(
    (l) => !isLegacySingleUse(l as BadgeRedemptionLinkDoc) && (l as { maxRedemptions?: unknown }).maxRedemptions === null
  );

  if (multiUnlimited) {
    const dupIds = all.filter((l) => l._id.toString() !== multiUnlimited._id.toString()).map((l) => l._id);
    if (dupIds.length > 0) {
      await coll.deleteMany({ _id: { $in: dupIds } });
    }
    const baseUrl = SITE_URL.replace(/\/$/, "");
    return { url: `${baseUrl}/badge/redeem/${multiUnlimited.token}`, token: multiUnlimited.token };
  }

  await coll.deleteMany({ badgeId: badgeObjId, createdBy });
  return createRedemptionLink(createdBy, badgeId, { maxRedemptions: null, expiresAt: null });
}

/** Remove all redemption links for a user-created badge (e.g. when deleting the badge). */
export async function deleteRedemptionLinksForBadge(badgeId: string, createdBy: string): Promise<void> {
  const client = await getDb();
  const dbName = await getDbName();
  const badgeObjId = new ObjectId(badgeId);
  await client.db(dbName).collection(COLLECTIONS.badgeRedemptionLinks).deleteMany({ badgeId: badgeObjId, createdBy });
}

export async function redeemLink(
  token: string,
  redeemerUserId: string
): Promise<{ success: true; badge: { id: string; label: string } } | { error: string }> {
  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection(COLLECTIONS.badgeRedemptionLinks);
  const badgeColl = client.db(dbName).collection(COLLECTIONS.userCreatedBadges);
  const eventsColl = client.db(dbName).collection(COLLECTIONS.badgeRedemptionEvents);

  const link = await coll.findOne({ token });
  if (!link) {
    return { error: "Link not found or invalid" };
  }

  const now = new Date();

  // Expiry check
  if (link.expiresAt && now > link.expiresAt) {
    return { error: "Link expired" };
  }

  const linkDoc = link as BadgeRedemptionLinkDoc;

  if (isLegacySingleUse(linkDoc)) {
    if (link.usedAt) {
      return { error: "This link has already been used" };
    }
    const badge = await badgeColl.findOne({ _id: link.badgeId });
    if (!badge) {
      return { error: "Badge no longer exists" };
    }
    return redeemLegacyLink(token, redeemerUserId, linkDoc, {
      label: badge.label,
      description: badge.description,
      color: badge.color,
      badgeType: badge.badgeType,
      imageUrl: badge.imageUrl,
      iconName: badge.iconName,
    });
  }

  // Multi-use: check duplicate per user
  const existing = await eventsColl.findOne({ token, redeemedBy: redeemerUserId });
  if (existing) {
    return { error: "You have already redeemed this link" };
  }

  // Multi-use: check cap
  if (link.maxRedemptions != null && link.maxRedemptions > 0) {
    const count = await eventsColl.countDocuments({ token });
    if (count >= link.maxRedemptions) {
      return { error: "This link has reached its redemption limit" };
    }
  }

  const badge = await badgeColl.findOne({ _id: link.badgeId });
  if (!badge) {
    return { error: "Badge no longer exists" };
  }

  const result = await createUserCreatedBadge(redeemerUserId, {
    label: badge.label ?? "",
    description: badge.description ?? null,
    color: badge.color ?? null,
    badgeType: (badge.badgeType as "label" | "image" | "icon") ?? "label",
    imageUrl: badge.imageUrl ?? null,
    iconName: badge.iconName ?? null,
  });

  if (!result) {
    return { error: "Failed to add badge" };
  }

  await eventsColl.insertOne({
    linkId: link._id,
    token,
    redeemedBy: redeemerUserId,
    redeemedAt: now,
  });

  return {
    success: true,
    badge: { id: result.id, label: result.label },
  };
}

export async function getLinkByToken(
  token: string,
  redeemerUserId?: string | null
): Promise<{
  valid: boolean;
  badgeLabel?: string;
  error?: string;
  alreadyRedeemed?: boolean;
}> {
  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection(COLLECTIONS.badgeRedemptionLinks);
  const badgeColl = client.db(dbName).collection(COLLECTIONS.userCreatedBadges);
  const eventsColl = client.db(dbName).collection(COLLECTIONS.badgeRedemptionEvents);

  const link = await coll.findOne({ token });
  if (!link) {
    return { valid: false, error: "Link not found" };
  }

  const now = new Date();
  const linkDoc = link as BadgeRedemptionLinkDoc;

  if (link.expiresAt && now > link.expiresAt) {
    return { valid: false, error: "Link expired" };
  }

  const badge = await badgeColl.findOne({ _id: link.badgeId });
  if (!badge) {
    return { valid: false, error: "Badge no longer exists" };
  }

  if (isLegacySingleUse(linkDoc)) {
    if (link.usedAt) {
      return { valid: false, error: "This link has already been used" };
    }
    return { valid: true, badgeLabel: badge.label ?? undefined };
  }

  // Multi-use: check cap
  if (link.maxRedemptions != null && link.maxRedemptions > 0) {
    const count = await eventsColl.countDocuments({ token });
    if (count >= link.maxRedemptions) {
      return { valid: false, error: "This link has reached its redemption limit" };
    }
  }

  let alreadyRedeemed = false;
  if (redeemerUserId) {
    const existing = await eventsColl.findOne({ token, redeemedBy: redeemerUserId });
    alreadyRedeemed = !!existing;
  }

  return {
    valid: true,
    badgeLabel: badge.label ?? undefined,
    alreadyRedeemed: redeemerUserId ? alreadyRedeemed : undefined,
  };
}

async function redeemLegacyLink(
  token: string,
  redeemerUserId: string,
  link: BadgeRedemptionLinkDoc,
  badge: { label?: string | null; description?: string | null; color?: string | null; badgeType?: string | null; imageUrl?: string | null; iconName?: string | null }
): Promise<{ success: true; badge: { id: string; label: string } } | { error: string }> {
  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection(COLLECTIONS.badgeRedemptionLinks);

  const result = await createUserCreatedBadge(redeemerUserId, {
    label: badge.label ?? "",
    description: badge.description ?? null,
    color: badge.color ?? null,
    badgeType: (badge.badgeType as "label" | "image" | "icon") ?? "label",
    imageUrl: badge.imageUrl ?? null,
    iconName: badge.iconName ?? null,
  });

  if (!result) {
    return { error: "Failed to add badge" };
  }

  await coll.updateOne(
    { token },
    { $set: { usedAt: new Date(), usedBy: redeemerUserId } }
  );

  return {
    success: true,
    badge: { id: result.id, label: result.label },
  };
}
