/**
 * Polar subscription & order state. Polar is the source of truth.
 * We sync from webhooks; when local DB is empty, we fetch from Polar API (Customer State, Orders)
 * so billing shows correctly even when webhooks missed (e.g. local dev).
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import {
  isPolarConfigured,
  getCustomerStateByExternalId,
  getPaidOrdersByExternalId,
} from "@/lib/polar";
import { getBillingSettings } from "@/lib/settings";

export interface UserPolarState {
  hasActiveSubscription: boolean;
  activeSubscription?: {
    polarSubscriptionId: string;
    productId: string;
    productName?: string;
    status: string;
  } | null;
  ownedProductIds: string[];
  /** Count of paid orders per product ID. */
  ownedProductQuantities: Record<string, number>;
}

/**
 * Get user's Polar state (subscriptions + orders). Syncs from Polar API when local DB is empty.
 */
export async function getUserPolarState(userId: string): Promise<UserPolarState> {
  const billing = await getBillingSettings();
  const sandbox = billing.sandbox;

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const subsColl = db.collection(COLLECTIONS.polarSubscriptions);
  const ordersColl = db.collection(COLLECTIONS.polarOrders);

  let activeSubs = await subsColl
    .find({ userId, status: { $in: ["active", "trialing"] } })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  // Sync paid orders from Polar API when local DB might be stale
  if (isPolarConfigured()) {
    const apiOrders = await getPaidOrdersByExternalId(userId, { sandbox });
    for (const o of apiOrders) {
      if (!o.productId) continue;
      const orderNow = new Date();
      const paidAt = o.modifiedAt ? new Date(o.modifiedAt) : new Date(o.createdAt);
      await ordersColl.updateOne(
        { polarOrderId: o.id },
        {
          $set: {
            polarOrderId: o.id,
            polarCustomerId: o.customerId,
            userId,
            productId: o.productId,
            productName: o.product?.name ?? null,
            amount: o.totalAmount,
            currency: (o.currency || "USD").toUpperCase(),
            status: "paid",
            paidAt,
            updatedAt: orderNow,
          },
          $setOnInsert: { createdAt: orderNow },
        },
        { upsert: true }
      );
    }
  }

  // If no local subscription, try Polar Customer State API and sync first active sub
  if (activeSubs.length === 0 && isPolarConfigured()) {
    const state = await getCustomerStateByExternalId(userId, { sandbox });
    const activeSubsFromApi = state?.active_subscriptions?.filter((s) =>
      ["active", "trialing"].includes(s.status)
    );
    if (activeSubsFromApi && activeSubsFromApi.length > 0 && state) {
      const sub = activeSubsFromApi[0];
      const now = new Date();
      await subsColl.updateOne(
        { polarSubscriptionId: sub.id },
        {
          $set: {
            polarSubscriptionId: sub.id,
            polarCustomerId: state.id,
            userId,
            productId: sub.product_id,
            productName: null,
            status: sub.status as "active" | "trialing",
            currentPeriodStart: sub.current_period_start
              ? new Date(sub.current_period_start)
              : null,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end)
              : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            canceledAt: sub.canceled_at ? new Date(sub.canceled_at) : null,
            endedAt: sub.ended_at ? new Date(sub.ended_at) : null,
            trialStart: sub.trial_start ? new Date(sub.trial_start) : null,
            trialEnd: sub.trial_end ? new Date(sub.trial_end) : null,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
      activeSubs = await subsColl
        .find({ userId, status: { $in: ["active", "trialing"] } })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
    }
  }

  const paidOrders = await ordersColl
    .find({ userId, status: "paid" })
    .toArray();

  const ownedProductQuantities: Record<string, number> = {};
  for (const o of paidOrders) {
    const pid = (o as { productId?: string }).productId;
    if (pid) {
      ownedProductQuantities[pid] = (ownedProductQuantities[pid] ?? 0) + 1;
    }
  }

  const activeSub = activeSubs[0] as unknown as
    | { polarSubscriptionId: string; productId: string; productName?: string; status: string }
    | undefined;

  return {
    hasActiveSubscription: !!activeSub,
    activeSubscription: activeSub
      ? {
          polarSubscriptionId: activeSub.polarSubscriptionId,
          productId: activeSub.productId,
          productName: activeSub.productName,
          status: activeSub.status,
        }
      : null,
    ownedProductIds: Object.keys(ownedProductQuantities).filter(Boolean),
    ownedProductQuantities,
  };
}
