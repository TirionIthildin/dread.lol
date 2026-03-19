/**
 * Verified Creator program: admin flag on user + one free creator badge + share link.
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/db/schema";
import { getCreatorProgramBadge } from "@/lib/user-created-badge";

export async function isVerifiedCreator(userId: string): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne({ _id: userId }, { projection: { verifiedCreator: 1 } });
  return doc?.verifiedCreator === true;
}

/** Revoked verifiedCreator: Premium drops unless Polar covers them; badge/links may remain. New creator APIs return 403. */
export async function assertVerifiedCreator(userId: string): Promise<{ ok: true } | { error: string }> {
  if (!(await isVerifiedCreator(userId))) {
    return { error: "Verified Creator access required" };
  }
  return { ok: true };
}

/** True if user may create their one program badge (verified + no creator badge yet). */
export async function canCreateCreatorProgramBadge(userId: string): Promise<boolean> {
  if (!(await isVerifiedCreator(userId))) return false;
  const existing = await getCreatorProgramBadge(userId);
  return existing === null;
}
