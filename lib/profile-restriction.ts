/**
 * Profile restriction: show "This profile has been restricted..." when user
 * has billing issues, subscription ended, or was terminated.
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/db/schema";
import { getBillingSettings } from "@/lib/settings";
import { isWithinBasicTrial } from "@/lib/dashboard-access";

export interface ProfileRestrictionStatus {
  restricted: boolean;
}

/**
 * Check if a user's profile should show the restricted message.
 * True when:
 * - User has restricted flag (admin set, e.g. terminated)
 * - User is unapproved AND Basic is required AND not within trial
 */
export async function getProfileRestrictionStatus(
  userId: string
): Promise<ProfileRestrictionStatus> {
  const [userDoc, billing] = await Promise.all([
    (async () => {
      const client = await getDb();
      const dbName = await getDbName();
      return client
        .db(dbName)
        .collection<UserDoc>(COLLECTIONS.users)
        .findOne(
          { _id: userId },
          { projection: { approved: 1, isAdmin: 1, restricted: 1, createdAt: 1 } }
        );
    })(),
    getBillingSettings(),
  ]);

  if (!userDoc) return { restricted: false };
  if (userDoc.restricted === true) return { restricted: true };
  if (userDoc.approved || userDoc.isAdmin) return { restricted: false };
  if (!billing.basicEnabled) return { restricted: false };

  const inTrial =
    billing.basicTrialDays > 0 &&
    isWithinBasicTrial(userDoc.createdAt, billing.basicTrialDays);
  if (inTrial) return { restricted: false };

  return { restricted: true };
}
