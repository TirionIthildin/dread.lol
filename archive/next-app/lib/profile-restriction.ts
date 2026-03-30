/**
 * Profile restriction: show "This profile has been restricted..." when user
 * is terminated (admin-set restricted flag).
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/db/schema";

export interface ProfileRestrictionStatus {
  restricted: boolean;
}

/**
 * Check if a user's profile should show the restricted message.
 * True when: user has restricted flag (admin set).
 */
export async function getProfileRestrictionStatus(
  userId: string
): Promise<ProfileRestrictionStatus> {
  const client = await getDb();
  const dbName = await getDbName();
  const userDoc = await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne(
      { _id: userId },
      { projection: { restricted: 1 } }
    );

  if (!userDoc) return { restricted: false };
  return { restricted: userDoc.restricted === true };
}
