/**
 * Non-webhook verification: when user lands on success URL with checkout_id,
 * we fetch the checkout from Polar API and process it. Idempotent via polar_checkouts collection.
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getPolarClient } from "@/lib/polar";
import { getBillingSettings } from "@/lib/settings";

export interface VerifyResult {
  ok: boolean;
  alreadyProcessed?: boolean;
  error?: string;
}

/**
 * Verify a checkout by ID with Polar API. If succeeded and not already processed,
 * records it in DB. Idempotent.
 * Uses billing.sandbox so we hit the same Polar environment the checkout was created in.
 */
export async function verifyCheckout(
  checkoutId: string,
  userId?: string | null
): Promise<VerifyResult> {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return { ok: false, error: "Polar not configured" };
  }

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const coll = db.collection(COLLECTIONS.polarCheckouts);

  const existing = await coll.findOne({ checkoutId });
  if (existing) {
    return { ok: true, alreadyProcessed: true };
  }

  try {
    const billing = await getBillingSettings();
    const polar = getPolarClient(billing.sandbox ? "sandbox" : "production");
    const checkout = await polar.checkouts.get({ id: checkoutId });
    const status = (checkout.status ?? "").toLowerCase();

    if (status !== "succeeded" && status !== "confirmed") {
      return {
        ok: false,
        error: status === "expired" ? "Checkout expired" : `Checkout status: ${status}`,
      };
    }

    const checkoutData = checkout as unknown as { order?: { id?: string }; order_id?: string };
    const orderId = checkoutData.order?.id ?? checkoutData.order_id ?? null;

    await coll.insertOne({
      checkoutId,
      userId: userId ?? null,
      orderId: orderId ?? null,
      processedAt: new Date(),
    });

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Polar", "Verify checkout error:", checkoutId, msg);
    return { ok: false, error: msg };
  }
}
