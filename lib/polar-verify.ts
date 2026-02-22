/**
 * Non-webhook verification: when user lands on success URL with checkout_id,
 * we fetch the checkout from Polar API and process it. Idempotent via polar_checkouts collection.
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { getPolarClient } from "@/lib/polar";
import { getBillingSettings } from "@/lib/settings";
import type { UserDoc } from "@/lib/db/schema";

export interface VerifyResult {
  ok: boolean;
  alreadyProcessed?: boolean;
  error?: string;
}

/**
 * Approve user when they paid for Basic (account creation). Called from verify and webhook.
 */
export async function approveUserIfBasicProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  const billing = await getBillingSettings();
  if (!billing.basicEnabled || !billing.basicProductId || productId !== billing.basicProductId) {
    return false;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const now = new Date();
  const result = await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .updateOne({ _id: userId }, { $set: { approved: true, updatedAt: now } });
  return result.modifiedCount > 0;
}

/**
 * Verify a checkout by ID with Polar API. If succeeded and not already processed,
 * records it in DB and runs grant logic (e.g. Basic → approve user). Idempotent.
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
    const polar = getPolarClient();
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

    // Basic tier: if order is for Basic product, approve user (immediate feedback when webhook is delayed)
    if (userId && orderId) {
      try {
        const order = await polar.orders.get({ id: orderId });
        const orderData = order as unknown as { productId?: string; product_id?: string };
        const productId = orderData.productId ?? orderData.product_id ?? null;
        if (productId) {
          await approveUserIfBasicProduct(userId, productId);
        }
      } catch {
        // Ignore: webhook will handle approve when it arrives
      }
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Polar] Verify checkout error:", checkoutId, msg);
    return { ok: false, error: msg };
  }
}
