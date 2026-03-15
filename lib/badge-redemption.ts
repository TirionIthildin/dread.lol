/**
 * Badge redemption links: shareable URLs to give a user-created badge.
 * Supports single-use (legacy) or multi-use with optional cap and expiry.
 * Per-user deduplication via badge_redemption_events.
 */
import { ObjectId, type Collection } from "mongodb";
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
    redemptionCount: 0,
    expiresAt: options?.expiresAt ?? null,
    createdAt: new Date(),
  };

  await coll.insertOne(doc);
  const baseUrl = SITE_URL.replace(/\/$/, "");
  const url = `${baseUrl}/badge/redeem/${token}`;
  return { url, token };
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
    return redeemLegacyLink(redeemerUserId, linkDoc, {
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

  // Multi-use: atomically reserve one redemption slot
  let reservedSlot = false;
  if (link.maxRedemptions != null && link.maxRedemptions > 0) {
    await ensureBadgeRedemptionCountInitialized(coll, eventsColl, link._id);
    reservedSlot = await reserveBadgeRedemptionSlot(coll, link._id, link.maxRedemptions);
    if (!reservedSlot) {
      return { error: "This link has reached its redemption limit" };
    }
  }

  const badge = await badgeColl.findOne({ _id: link.badgeId });
  if (!badge) {
    if (reservedSlot) {
      await releaseBadgeRedemptionSlot(coll, link._id);
    }
    return { error: "Badge no longer exists" };
  }

  let insertedRedemptionEvent = false;
  try {
    await eventsColl.insertOne({
      linkId: link._id,
      token,
      redeemedBy: redeemerUserId,
      redeemedAt: now,
    });
    insertedRedemptionEvent = true;
  } catch (err) {
    if (reservedSlot) {
      await releaseBadgeRedemptionSlot(coll, link._id);
    }
    if (isDuplicateKeyError(err)) {
      return { error: "You have already redeemed this link" };
    }
    return { error: "Failed to redeem link" };
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
    let rolledBackEvent = false;
    if (insertedRedemptionEvent) {
      rolledBackEvent = await rollbackBadgeRedemptionEvent(eventsColl, link._id, redeemerUserId);
    }
    if (reservedSlot && rolledBackEvent) {
      await releaseBadgeRedemptionSlot(coll, link._id);
    }
    return { error: "Failed to add badge" };
  }

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
  redeemerUserId: string,
  link: BadgeRedemptionLinkDoc,
  badge: { label?: string | null; description?: string | null; color?: string | null; badgeType?: string | null; imageUrl?: string | null; iconName?: string | null }
): Promise<{ success: true; badge: { id: string; label: string } } | { error: string }> {
  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection(COLLECTIONS.badgeRedemptionLinks);

  // Atomically claim legacy links so only one concurrent redeemer can proceed.
  const claimed = await claimLegacyRedemption(coll, link._id, redeemerUserId);
  if (!claimed) {
    return { error: "This link has already been used" };
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
    await releaseLegacyRedemptionClaim(coll, link._id, redeemerUserId);
    return { error: "Failed to add badge" };
  }

  return {
    success: true,
    badge: { id: result.id, label: result.label },
  };
}

async function claimLegacyRedemption(
  linksColl: Collection,
  linkId: ObjectId,
  redeemerUserId: string
): Promise<boolean> {
  const claimed = await linksColl.findOneAndUpdate(
    { _id: linkId, usedAt: null },
    { $set: { usedAt: new Date(), usedBy: redeemerUserId } },
    { returnDocument: "after", projection: { _id: 1 } }
  );
  return !!claimed;
}

async function releaseLegacyRedemptionClaim(
  linksColl: Collection,
  linkId: ObjectId,
  redeemerUserId: string
): Promise<void> {
  await linksColl.updateOne(
    { _id: linkId, usedBy: redeemerUserId },
    { $set: { usedAt: null, usedBy: null } }
  );
}

async function ensureBadgeRedemptionCountInitialized(
  linksColl: Collection,
  eventsColl: Collection,
  linkId: ObjectId
): Promise<void> {
  const link = await linksColl.findOne({ _id: linkId }, { projection: { redemptionCount: 1 } });
  if (typeof link?.redemptionCount === "number") return;
  const count = await eventsColl.countDocuments({ linkId });
  await linksColl.updateOne(
    { _id: linkId, redemptionCount: { $exists: false } },
    { $set: { redemptionCount: count } }
  );
}

async function reserveBadgeRedemptionSlot(
  linksColl: Collection,
  linkId: ObjectId,
  maxRedemptions: number
): Promise<boolean> {
  const reserved = await linksColl.findOneAndUpdate(
    { _id: linkId, redemptionCount: { $lt: maxRedemptions } },
    { $inc: { redemptionCount: 1 } },
    { returnDocument: "after", projection: { _id: 1 } }
  );
  return !!reserved;
}

async function releaseBadgeRedemptionSlot(
  linksColl: Collection,
  linkId: ObjectId
): Promise<void> {
  await linksColl.updateOne(
    { _id: linkId, redemptionCount: { $gt: 0 } },
    { $inc: { redemptionCount: -1 } }
  );
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;
}

async function rollbackBadgeRedemptionEvent(
  eventsColl: Collection,
  linkId: ObjectId,
  redeemerUserId: string
): Promise<boolean> {
  try {
    const result = await eventsColl.deleteOne({ linkId, redeemedBy: redeemerUserId });
    return result.deletedCount > 0;
  } catch {
    return false;
  }
}
