import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/db/schema";

export async function findLocalUserByUsername(normalizedUsername: string): Promise<UserDoc | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const row = await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne({ authProvider: "local", username: normalizedUsername });
  return row ?? null;
}

export async function findLocalUserByEmail(normalizedEmail: string): Promise<UserDoc | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const row = await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne({ authProvider: "local", email: normalizedEmail });
  return row ?? null;
}

export async function findUserById(userId: string): Promise<UserDoc | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const row = await client.db(dbName).collection<UserDoc>(COLLECTIONS.users).findOne({ _id: userId });
  return row ?? null;
}
