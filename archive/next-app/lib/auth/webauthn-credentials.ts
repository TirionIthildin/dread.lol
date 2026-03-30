import { Binary, ObjectId } from "mongodb";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { WebAuthnCredentialDoc } from "@/lib/db/schema";

export async function listWebAuthnCredentialsForUser(userId: string): Promise<WebAuthnCredentialDoc[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const rows = await client
    .db(dbName)
    .collection<WebAuthnCredentialDoc>(COLLECTIONS.webauthnCredentials)
    .find({ userId })
    .toArray();
  return rows;
}

export async function saveWebAuthnCredential(
  userId: string,
  data: {
    credentialId: string;
    publicKey: Uint8Array;
    counter: number;
    transports?: string[];
  }
): Promise<void> {
  const client = await getDb();
  const dbName = await getDbName();
  const now = new Date();
  await client.db(dbName).collection(COLLECTIONS.webauthnCredentials).insertOne({
    _id: new ObjectId(),
    userId,
    credentialId: data.credentialId,
    publicKey: new Binary(Buffer.from(data.publicKey)),
    counter: data.counter,
    transports: data.transports ?? null,
    createdAt: now,
  });
}

export async function findCredentialByCredentialId(
  credentialId: string
): Promise<WebAuthnCredentialDoc | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const row = await client
    .db(dbName)
    .collection<WebAuthnCredentialDoc>(COLLECTIONS.webauthnCredentials)
    .findOne({ credentialId });
  return row ?? null;
}

export async function updateCredentialCounter(credentialId: string, counter: number): Promise<void> {
  const client = await getDb();
  const dbName = await getDbName();
  await client
    .db(dbName)
    .collection(COLLECTIONS.webauthnCredentials)
    .updateOne({ credentialId }, { $set: { counter } });
}
