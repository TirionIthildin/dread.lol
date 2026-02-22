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
  /** Display name for the subscription tier (e.g. "Premium"). */
  tierName: string;
  /** Product IDs that grant this tier (subscription or one-time). First is default for checkout. */
  productIds: string[];
  sandbox: boolean;
  /** Whether Polar env vars are configured (read-only indicator). */
  polarConfigured: boolean;
  /** Basic tier: $4 one-time to create account. */
  basicEnabled: boolean;
  /** Product IDs that grant account creation. First is default for checkout. */
  basicProductIds: string[];
  basicTierName: string;
  /** Price in cents for display (e.g. 400 = $4). */
  basicPriceCents: number;
}

/**
 * Get billing settings. Admin DB values override env.
 * Requires POLAR_ACCESS_TOKEN for billing to function; admin can disable via billing.enabled.
 */
export async function getBillingSettings(): Promise<BillingSettings> {
  const polarConfigured = !!process.env.POLAR_ACCESS_TOKEN;
  const enabledFromDb = await getSetting<boolean>("billing.enabled");
  const tierNameFromDb = await getSetting<string | null>("billing.tierName");
  const productIdsFromDb = await getSetting<string[] | string | null>("billing.productIds");
  const productIdFromDb = await getSetting<string | null>("billing.productId"); // legacy
  const sandboxFromDb = await getSetting<boolean>("billing.sandbox");

  const tierName =
    tierNameFromDb !== undefined && tierNameFromDb !== null && String(tierNameFromDb).trim()
      ? String(tierNameFromDb).trim()
      : "Premium";

  const basicEnabledFromDb = await getSetting<boolean>("billing.basicEnabled");
  const basicProductIdsFromDb = await getSetting<string[] | string | null>("billing.basicProductIds");
  const basicProductIdFromDb = await getSetting<string | null>("billing.basicProductId"); // legacy
  const basicTierNameFromDb = await getSetting<string | null>("billing.basicTierName");
  const basicPriceCentsFromDb = await getSetting<number>("billing.basicPriceCents");

  const basicEnabled =
    basicEnabledFromDb !== undefined && basicEnabledFromDb !== null
      ? Boolean(basicEnabledFromDb)
      : false;
  const basicProductIds = parseProductIds(basicProductIdsFromDb, basicProductIdFromDb);
  const basicTierName =
    basicTierNameFromDb !== undefined && basicTierNameFromDb !== null && String(basicTierNameFromDb).trim()
      ? String(basicTierNameFromDb).trim()
      : "Basic";
  const basicPriceCents =
    basicPriceCentsFromDb !== undefined && basicPriceCentsFromDb !== null && typeof basicPriceCentsFromDb === "number"
      ? Math.max(0, Math.round(basicPriceCentsFromDb))
      : 400;

  const enabled =
    enabledFromDb !== undefined && enabledFromDb !== null
      ? Boolean(enabledFromDb)
      : false;
  const productIds = parseProductIds(productIdsFromDb, productIdFromDb);
  const sandbox =
    sandboxFromDb !== undefined && sandboxFromDb !== null
      ? Boolean(sandboxFromDb)
      : process.env.POLAR_SANDBOX === "1" || process.env.POLAR_SANDBOX === "true";

  return {
    enabled: enabled && polarConfigured,
    tierName,
    productIds,
    sandbox,
    polarConfigured,
    basicEnabled: basicEnabled && !!polarConfigured,
    basicProductIds,
    basicTierName,
    basicPriceCents,
  };
}

function parseProductIds(
  fromDb: string[] | string | null | undefined,
  legacy: string | null | undefined
): string[] {
  if (Array.isArray(fromDb) && fromDb.length > 0) {
    return fromDb.map((id) => String(id).trim()).filter(Boolean);
  }
  if (fromDb && typeof fromDb === "string" && fromDb.trim()) {
    return fromDb.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  }
  const legacyVal = legacy && typeof legacy === "string" ? legacy.trim() : null;
  return legacyVal ? [legacyVal] : [];
}
