/**
 * Site settings stored in MongoDB. Admin-configurable values override env defaults.
 * Key-value store; keys use dot notation (e.g. billing.enabled).
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

export async function getSetting<T = unknown>(
  key: string,
  defaultValue?: T
): Promise<T | undefined> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client.db(dbName).collection(COLLECTIONS.settings).findOne({ key });
  if (!doc || doc.value === undefined || doc.value === null) {
    return defaultValue as T | undefined;
  }
  return doc.value as T;
}

export async function setSetting<T = unknown>(
  key: string,
  value: T,
  updatedBy?: string
): Promise<void> {
  const client = await getDb();
  const dbName = await getDbName();
  const now = new Date();
  await client
    .db(dbName)
    .collection(COLLECTIONS.settings)
    .updateOne(
      { key },
      {
        $set: {
          value,
          updatedAt: now,
          ...(updatedBy && { updatedBy }),
        },
      },
      { upsert: true }
    );
}

export interface BillingSettings {
  enabled: boolean;
  productId: string | null;
  sandbox: boolean;
  /** Whether Polar env vars are configured (read-only indicator). */
  polarConfigured: boolean;
}

/**
 * Get billing settings. Admin DB values override env.
 * Requires POLAR_ACCESS_TOKEN for billing to function; admin can disable via billing.enabled.
 */
export async function getBillingSettings(): Promise<BillingSettings> {
  const polarConfigured = !!process.env.POLAR_ACCESS_TOKEN;
  const enabledFromDb = await getSetting<boolean>("billing.enabled");
  const productIdFromDb = await getSetting<string | null>("billing.productId");
  const sandboxFromDb = await getSetting<boolean>("billing.sandbox");

  const enabled =
    enabledFromDb !== undefined && enabledFromDb !== null
      ? Boolean(enabledFromDb)
      : false;
  const productId =
    productIdFromDb !== undefined && productIdFromDb !== null
      ? (productIdFromDb?.trim() || null)
      : (process.env.POLAR_PRODUCT_ID?.trim() || null);
  const sandbox =
    sandboxFromDb !== undefined && sandboxFromDb !== null
      ? Boolean(sandboxFromDb)
      : process.env.POLAR_SANDBOX === "1" || process.env.POLAR_SANDBOX === "true";

  return {
    enabled: enabled && polarConfigured,
    productId,
    sandbox,
    polarConfigured,
  };
}
