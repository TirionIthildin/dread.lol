/**
 * Polar webhooks – subscription/order events.
 * Polar is the source of truth; we sync state into our DB for display and limits.
 * When POLAR_WEBHOOK_SECRET is not set, returns 503.
 */
import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@polar-sh/nextjs";
import { getDb, getDbName, COLLECTIONS, type UserDoc } from "@/lib/db";
import { getBillingSettings } from "@/lib/settings";

function getExternalId(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const r = obj as Record<string, unknown>;
  const customer = r.customer as Record<string, unknown> | undefined;
  const v =
    customer?.external_id ??
    customer?.externalId ??
    r.customer_external_id;
  return typeof v === "string" ? v : null;
}

async function syncSubscription(data: unknown) {
  const sub = data as Record<string, unknown>;
  const externalId = getExternalId(sub);
  if (!externalId) return;
  if (!externalId) return;

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const user = await db.collection<UserDoc>(COLLECTIONS.users).findOne({ _id: externalId });
  if (!user) return;

  const productId = (sub.product_id ?? sub.productId) as string | undefined;
  const customerId = ((sub.customer_id ?? sub.customerId) as string | undefined) ?? "";
  const product = sub.product as Record<string, unknown> | undefined;

  const now = new Date();
  await db.collection(COLLECTIONS.polarSubscriptions).updateOne(
    { polarSubscriptionId: sub.id },
    {
      $set: {
        polarSubscriptionId: sub.id,
        polarCustomerId: customerId,
        userId: externalId,
        productId: productId ?? "",
        productName: (product?.name as string | null) ?? null,
        status: (sub.status ?? "active") as string,
        currentPeriodStart: sub.current_period_start
          ? new Date(sub.current_period_start as string)
          : null,
        currentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end as string)
          : null,
        cancelAtPeriodEnd: (sub.cancel_at_period_end ?? false) as boolean,
        canceledAt: sub.canceled_at
          ? new Date(sub.canceled_at as string)
          : null,
        endedAt: sub.ended_at ? new Date(sub.ended_at as string) : null,
        trialStart: sub.trial_start ? new Date(sub.trial_start as string) : null,
        trialEnd: sub.trial_end ? new Date(sub.trial_end as string) : null,
        metadata: (sub.metadata as Record<string, unknown>) ?? null,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
}

async function syncOrder(data: unknown) {
  const order = data as Record<string, unknown>;
  const externalId = getExternalId(order);
  if (!externalId) return;

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const user = await db.collection<UserDoc>(COLLECTIONS.users).findOne({ _id: externalId });
  if (!user) return;

  let status: "pending" | "paid" | "refunded" | "canceled" = "pending";
  if (order.refunded_at) status = "refunded";
  else if (order.canceled_at) status = "canceled";
  else if (order.paid === true || order.paid_at) status = "paid";

  const paidAt =
    order.paid_at != null
      ? new Date(order.paid_at as string)
      : status === "paid" && (order.modified_at ?? order.created_at)
        ? new Date((order.modified_at ?? order.created_at) as string)
        : null;

  const amount =
    (order.total_amount ?? order.totalAmount ?? order.amount ?? 0) as number;
  const productId = (order.product_id ?? order.productId) as string;
  const customerId = ((order.customer_id ?? order.customerId) as string | undefined) ?? "";
  const product = order.product as Record<string, unknown> | undefined;

  if (!productId) return;

  const now = new Date();
  await db.collection(COLLECTIONS.polarOrders).updateOne(
    { polarOrderId: order.id },
    {
      $set: {
        polarOrderId: order.id,
        polarCustomerId: customerId,
        userId: externalId,
        productId,
        productName: (product?.name as string | null) ?? null,
        amount: Number(amount),
        currency: ((order.currency as string) || "USD").toUpperCase(),
        status,
        paidAt,
        refundedAt: order.refunded_at ? new Date(order.refunded_at as string) : null,
        canceledAt: order.canceled_at ? new Date(order.canceled_at as string) : null,
        metadata: (order.metadata as Record<string, unknown>) ?? null,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  // Basic tier: approve user when they pay for account creation
  if (status === "paid") {
    const billing = await getBillingSettings();
    if (billing.basicEnabled && billing.basicProductIds.length > 0 && billing.basicProductIds.includes(productId)) {
      await db.collection<UserDoc>(COLLECTIONS.users).updateOne(
        { _id: externalId },
        { $set: { approved: true, updatedAt: now } }
      );
    }
  }
}

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
const polarWebhookHandler =
  webhookSecret &&
  Webhooks({
    webhookSecret,
    onPayload: async () => {},
    onSubscriptionCreated: async (p) => syncSubscription(p.data),
    onSubscriptionUpdated: async (p) => syncSubscription(p.data),
    onSubscriptionActive: async (p) => syncSubscription(p.data),
    onSubscriptionCanceled: async (p) => syncSubscription(p.data),
    onSubscriptionRevoked: async (p) => syncSubscription(p.data),
    onOrderCreated: async (p) => syncOrder(p.data),
    onOrderPaid: async (p) => syncOrder(p.data),
  });

export async function POST(request: NextRequest) {
  if (!polarWebhookHandler) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }
  return polarWebhookHandler(request);
}
