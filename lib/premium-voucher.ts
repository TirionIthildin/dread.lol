/**
 * Premium voucher links: shareable URLs that grant Premium when redeemed.
 * Admin creates links; each link is tied to a creator for attribution.
 * Redemptions are logged for stats.
 */
import { ObjectId, type Collection } from "mongodb";
import crypto from "node:crypto";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { setUserBadges } from "@/lib/member-profiles";

const TOKEN_BYTES = 24;
const TOKEN_LENGTH = 32;

function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url").slice(0, TOKEN_LENGTH);
}

export async function createPremiumVoucherLink(
  creatorId: string,
  options?: { maxRedemptions?: number | null; expiresAt?: Date | null; label?: string | null }
): Promise<{ url: string; token: string } | { error: string }> {
  const client = await getDb();
  const dbName = await getDbName();
  const coll = client.db(dbName).collection(COLLECTIONS.premiumVoucherLinks);

  const token = generateToken();
  const doc = {
    token,
    createdBy: creatorId,
    createdAt: new Date(),
    expiresAt: options?.expiresAt ?? null,
    maxRedemptions: options?.maxRedemptions ?? null,
    redemptionCount: 0,
    label: options?.label ?? null,
  };

  await coll.insertOne(doc);
  const baseUrl = SITE_URL.replace(/\/$/, "");
  const url = `${baseUrl}/premium/redeem/${token}`;
  return { url, token };
}

export async function redeemPremiumVoucher(
  token: string,
  redeemerUserId: string
): Promise<{ success: true } | { error: string }> {
  const client = await getDb();
  const dbName = await getDbName();
  const linksColl = client.db(dbName).collection(COLLECTIONS.premiumVoucherLinks);
  const redemptionsColl = client.db(dbName).collection(COLLECTIONS.premiumVoucherRedemptions);

  const link = await linksColl.findOne({ token });
  if (!link) {
    return { error: "Link not found or invalid" };
  }

  const now = new Date();

  if (link.expiresAt && now > link.expiresAt) {
    return { error: "Link expired" };
  }

  const existing = await redemptionsColl.findOne({ token, redeemedBy: redeemerUserId });
  if (existing) {
    if (isPendingPremiumGrant(existing)) {
      const recovered = await completePendingPremiumGrant(
        redemptionsColl,
        link._id,
        redeemerUserId
      );
      if (recovered) return { success: true };
      return { error: "Failed to grant Premium" };
    }
    // Idempotent recovery: if redemption exists, retry grant so users can self-heal.
    return grantPremiumToRedeemer(redeemerUserId);
  }

  let reservedSlot = false;
  if (link.maxRedemptions != null && link.maxRedemptions > 0) {
    await ensurePremiumVoucherRedemptionCountInitialized(linksColl, redemptionsColl, link._id);
    reservedSlot = await reservePremiumVoucherRedemptionSlot(
      linksColl,
      link._id,
      link.maxRedemptions
    );
    if (!reservedSlot) {
      return { error: "This link has reached its redemption limit" };
    }
  }

  let shouldReleaseReservedSlot = reservedSlot;
  let insertedRedemptionEvent = false;
  try {
    try {
      await redemptionsColl.insertOne({
        linkId: link._id,
        token,
        redeemedBy: redeemerUserId,
        creatorId: link.createdBy,
        redeemedAt: now,
        grantPending: true,
      });
      insertedRedemptionEvent = true;
      shouldReleaseReservedSlot = false;
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        // Concurrent duplicate insert means redemption already exists; treat as idempotent grant.
        return grantPremiumToRedeemer(redeemerUserId);
      }
      return { error: "Failed to redeem link" };
    }

    const ok = await setUserBadges(redeemerUserId, { premiumGranted: true });
    if (!ok) {
      if (insertedRedemptionEvent) {
        const rolledBackEvent = await rollbackPremiumVoucherRedemptionEvent(
          redemptionsColl,
          link._id,
          redeemerUserId
        );
        if (rolledBackEvent) {
          shouldReleaseReservedSlot = reservedSlot;
        }
      }
      return { error: "Failed to grant Premium" };
    }

    await markPremiumVoucherGrantCompleted(redemptionsColl, link._id, redeemerUserId);
    return { success: true };
  } catch (err) {
    if (insertedRedemptionEvent) {
      const rolledBackEvent = await rollbackPremiumVoucherRedemptionEvent(
        redemptionsColl,
        link._id,
        redeemerUserId
      );
      if (rolledBackEvent) {
        shouldReleaseReservedSlot = reservedSlot;
      }
    }
    throw err;
  } finally {
    if (shouldReleaseReservedSlot) {
      await releasePremiumVoucherRedemptionSlot(linksColl, link._id);
    }
  }
}

export async function getPremiumVoucherByToken(
  token: string,
  redeemerUserId?: string | null
): Promise<{
  valid: boolean;
  error?: string;
  alreadyRedeemed?: boolean;
}> {
  const client = await getDb();
  const dbName = await getDbName();
  const linksColl = client.db(dbName).collection(COLLECTIONS.premiumVoucherLinks);
  const redemptionsColl = client.db(dbName).collection(COLLECTIONS.premiumVoucherRedemptions);

  const link = await linksColl.findOne({ token });
  if (!link) {
    return { valid: false, error: "Link not found" };
  }

  const now = new Date();

  if (link.expiresAt && now > link.expiresAt) {
    return { valid: false, error: "Link expired" };
  }

  if (link.maxRedemptions != null && link.maxRedemptions > 0) {
    const count = await redemptionsColl.countDocuments({ token });
    if (count >= link.maxRedemptions) {
      return { valid: false, error: "This link has reached its redemption limit" };
    }
  }

  let alreadyRedeemed = false;
  if (redeemerUserId) {
    const existing = await redemptionsColl.findOne({ token, redeemedBy: redeemerUserId });
    alreadyRedeemed = !!existing && !isPendingPremiumGrant(existing);
  }

  return {
    valid: true,
    alreadyRedeemed: redeemerUserId ? alreadyRedeemed : undefined,
  };
}

export interface PremiumVoucherStatsByCreator {
  creatorId: string;
  displayName: string;
  linkCount: number;
  redemptionCount: number;
}

export interface PremiumVoucherStatsByLink {
  linkId: string;
  token: string;
  creatorId: string;
  displayName: string;
  label?: string | null;
  redemptionCount: number;
  createdAt: Date;
}

export async function getPremiumVoucherStats(): Promise<{
  byCreator: PremiumVoucherStatsByCreator[];
  byLink: PremiumVoucherStatsByLink[];
}> {
  const client = await getDb();
  const dbName = await getDbName();
  const linksColl = client.db(dbName).collection(COLLECTIONS.premiumVoucherLinks);
  const redemptionsColl = client.db(dbName).collection(COLLECTIONS.premiumVoucherRedemptions);
  const usersColl = client.db(dbName).collection(COLLECTIONS.users);

  const links = await linksColl.find({}).sort({ createdAt: -1 }).toArray();
  const redemptions = await redemptionsColl.find({}).toArray();

  const creatorIds = [...new Set(links.map((l) => l.createdBy))];
  const userDocs = await usersColl
    .find({ _id: { $in: creatorIds } })
    .project({ _id: 1, username: 1, displayName: 1 })
    .toArray();
  const userMap = new Map(userDocs.map((u) => [u._id, u]));

  const linkRedemptionCount = new Map<string, number>();
  for (const r of redemptions) {
    const key = r.linkId.toString();
    linkRedemptionCount.set(key, (linkRedemptionCount.get(key) ?? 0) + 1);
  }

  const creatorLinkCount = new Map<string, number>();
  const creatorRedemptionCount = new Map<string, number>();
  for (const l of links) {
    const c = l.createdBy;
    creatorLinkCount.set(c, (creatorLinkCount.get(c) ?? 0) + 1);
    creatorRedemptionCount.set(c, (creatorRedemptionCount.get(c) ?? 0) + (linkRedemptionCount.get(l._id.toString()) ?? 0));
  }

  const byCreator: PremiumVoucherStatsByCreator[] = creatorIds.map((creatorId) => {
    const u = userMap.get(creatorId);
    const displayName = (u?.displayName ?? u?.username ?? creatorId) || creatorId;
    return {
      creatorId,
      displayName,
      linkCount: creatorLinkCount.get(creatorId) ?? 0,
      redemptionCount: creatorRedemptionCount.get(creatorId) ?? 0,
    };
  });

  const byLink: PremiumVoucherStatsByLink[] = links.map((l) => {
    const u = userMap.get(l.createdBy);
    const displayName = (u?.displayName ?? u?.username ?? l.createdBy) || l.createdBy;
    return {
      linkId: l._id.toString(),
      token: maskToken(l.token),
      creatorId: l.createdBy,
      displayName,
      label: l.label ?? null,
      redemptionCount: linkRedemptionCount.get(l._id.toString()) ?? 0,
      createdAt: l.createdAt,
    };
  });

  return { byCreator, byLink };
}

function maskToken(token: string): string {
  if (token.length <= 8) return "••••";
  return token.slice(0, 4) + "••••" + token.slice(-4);
}

async function ensurePremiumVoucherRedemptionCountInitialized(
  linksColl: Collection,
  redemptionsColl: Collection,
  linkId: ObjectId
): Promise<void> {
  const link = await linksColl.findOne({ _id: linkId }, { projection: { redemptionCount: 1 } });
  if (typeof link?.redemptionCount === "number") return;
  const count = await redemptionsColl.countDocuments({ linkId });
  await linksColl.updateOne(
    { _id: linkId, redemptionCount: { $exists: false } },
    { $set: { redemptionCount: count } }
  );
}

async function reservePremiumVoucherRedemptionSlot(
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

async function releasePremiumVoucherRedemptionSlot(
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

async function rollbackPremiumVoucherRedemptionEvent(
  redemptionsColl: Collection,
  linkId: ObjectId,
  redeemerUserId: string
): Promise<boolean> {
  try {
    const result = await redemptionsColl.deleteOne({ linkId, redeemedBy: redeemerUserId });
    return result.deletedCount > 0;
  } catch {
    return false;
  }
}

async function grantPremiumToRedeemer(
  redeemerUserId: string
): Promise<{ success: true } | { error: string }> {
  const ok = await setUserBadges(redeemerUserId, { premiumGranted: true });
  if (!ok) {
    return { error: "Failed to grant Premium" };
  }
  return { success: true };
}

function isPendingPremiumGrant(
  redemptionDoc: unknown
): redemptionDoc is { grantPending: true } {
  return (
    typeof redemptionDoc === "object" &&
    redemptionDoc !== null &&
    "grantPending" in redemptionDoc &&
    (redemptionDoc as { grantPending?: unknown }).grantPending === true
  );
}

async function markPremiumVoucherGrantCompleted(
  redemptionsColl: Collection,
  linkId: ObjectId,
  redeemerUserId: string
): Promise<void> {
  try {
    await redemptionsColl.updateOne(
      { linkId, redeemedBy: redeemerUserId, grantPending: true },
      { $set: { grantPending: false, grantedAt: new Date() } }
    );
  } catch {
    // Best-effort marker; grant itself has already succeeded.
  }
}

async function completePendingPremiumGrant(
  redemptionsColl: Collection,
  linkId: ObjectId,
  redeemerUserId: string
): Promise<boolean> {
  try {
    const ok = await setUserBadges(redeemerUserId, { premiumGranted: true });
    if (!ok) return false;
    await markPremiumVoucherGrantCompleted(redemptionsColl, linkId, redeemerUserId);
    return true;
  } catch {
    return false;
  }
}
