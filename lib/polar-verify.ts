/**
 * Non-webhook verification: when user lands on success URL with checkout_id,
 * we fetch the checkout from Polar API and process it. Idempotent via polar_checkouts collection.
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { getPolarClient } from "@/lib/polar";

export interface VerifyResult {
  ok: boolean;
  alreadyProcessed?: boolean;
  error?: string;
}

/**
 * Verify a checkout by ID with Polar API. If succeeded and not already processed,
 * records it in DB and runs grant logic. Idempotent.
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

    const checkoutData = checkout as unknown as { order?: { id?: string } };
    const orderId = checkoutData.order?.id ?? null;

    await coll.insertOne({
      checkoutId,
      userId: userId ?? null,
      orderId: orderId ?? null,
      processedAt: new Date(),
    });

    // TODO: Grant benefits based on checkout.order or checkout.product (e.g. update user badges, entitlements)
    // Example: await grantPolarBenefits(userId, checkout);

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Polar] Verify checkout error:", checkoutId, msg);
    return { ok: false, error: msg };
  }
}
