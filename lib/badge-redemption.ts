/**
 * Badge redemption links: one-time-use URLs to share a user-created badge.
 * Creator generates a link; anyone who visits it (signed in) receives a copy of the badge.
 */
import { ObjectId } from "mongodb";
import crypto from "node:crypto";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { createUserCreatedBadge } from "@/lib/user-created-badge";

const TOKEN_BYTES = 24;
const TOKEN_LENGTH = 32; // base64url encoded

function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url").slice(0, TOKEN_LENGTH);
}

export async function createRedemptionLink(
  createdBy: string,
  badgeId: string
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

  const link = await coll.findOne({ token });
  if (!link) {
    return { error: "Link not found or invalid" };
  }
  if (link.usedAt) {
    return { error: "This link has already been used" };
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

  await coll.updateOne(
    { token },
    { $set: { usedAt: new Date(), usedBy: redeemerUserId } }
  );

  return {
    success: true,
    badge: { id: result.id, label: result.label },
  };
}

export async function getLinkByToken(token: string): Promise<{
  valid: boolean;
  badgeLabel?: string;
  error?: string;
}> {
  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection(COLLECTIONS.badgeRedemptionLinks);
  const badgeColl = client.db(dbName).collection(COLLECTIONS.userCreatedBadges);

  const link = await coll.findOne({ token });
  if (!link) {
    return { valid: false, error: "Link not found" };
  }
  if (link.usedAt) {
    return { valid: false, error: "This link has already been used" };
  }

  const badge = await badgeColl.findOne({ _id: link.badgeId });
  if (!badge) {
    return { valid: false, error: "Badge no longer exists" };
  }

  return { valid: true, badgeLabel: badge.label ?? undefined };
}
