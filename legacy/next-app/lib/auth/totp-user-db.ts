import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/db/schema";
import { findUserById } from "@/lib/auth/local-account";

export async function removeBackupCodeAtIndex(userId: string, index: number): Promise<boolean> {
  const existing = await findUserById(userId);
  const hashes = existing?.totpBackupCodesHash;
  if (!hashes || index < 0 || index >= hashes.length) return false;
  const next = [...hashes];
  next.splice(index, 1);
  const client = await getDb();
  const dbName = await getDbName();
  await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .updateOne({ _id: userId }, { $set: { totpBackupCodesHash: next, updatedAt: new Date() } });
  return true;
}
