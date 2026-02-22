/**
 * Polar billing integration. Uses Polar SDK and Customer State API.
 * When local DB is empty, we sync from Polar API on read (fallback when webhooks miss).
 * See Nimlos for reference implementation.
 */
import { Polar } from "@polar-sh/sdk";
import { getCanonicalOrigin } from "@/lib/site";

const isSandbox =
  process.env.POLAR_SANDBOX === "1" || process.env.POLAR_SANDBOX === "true";

/**
 * Whether Polar is configured (access token set).
 * Use this to avoid throwing in routes that can run without Polar (e.g. checkout redirect).
 */
export function isPolarConfigured(): boolean {
  return !!process.env.POLAR_ACCESS_TOKEN;
}

/**
 * Polar SDK client. Throws if POLAR_ACCESS_TOKEN is not set.
 * @param serverOverride - Override sandbox/production (e.g. from billing settings).
 */
export function getPolarClient(serverOverride?: "sandbox" | "production"): Polar {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }
  const server =
    serverOverride ?? (isSandbox ? "sandbox" : "production");
  return new Polar({
    accessToken,
    server,
  });
}

export interface PolarCustomerState {
  id: string;
  external_id: string | null;
  active_subscriptions: Array<{
    id: string;
    status: string;
    product_id: string;
    current_period_start?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
    canceled_at?: string | null;
    ended_at?: string | null;
    trial_start?: string | null;
    trial_end?: string | null;
  }>;
  granted_benefits: unknown[];
}

function getApiBase(sandbox?: boolean): string {
  const useSandbox =
    sandbox ?? (process.env.POLAR_SANDBOX === "1" || process.env.POLAR_SANDBOX === "true");
  return useSandbox ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";
}

/**
 * Get customer state by external_id (our userId = Discord ID).
 * Use when webhook sync missed or external_id was set after checkout.
 * Returns null if Polar is not configured, 404, or error.
 * @param sandbox - Override sandbox mode (e.g. from billing settings).
 */
export async function getCustomerStateByExternalId(
  userId: string,
  options?: { sandbox?: boolean }
): Promise<PolarCustomerState | null> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) return null;

  const apiBase = getApiBase(options?.sandbox);
  try {
    const res = await fetch(
      `${apiBase}/v1/customers/external/${encodeURIComponent(userId)}/state`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as PolarCustomerState;
  } catch {
    return null;
  }
}

export interface PolarOrderFromApi {
  id: string;
  productId: string | null;
  totalAmount: number;
  currency: string;
  paid: boolean;
  customerId: string;
  customer?: { externalId?: string | null; external_id?: string | null };
  modifiedAt: Date | null;
  createdAt: Date;
  product?: { name?: string | null };
}

/**
 * Fetch paid one-time orders for a customer by external_id (our userId).
 * Fallback when webhooks are not available (e.g. local dev without ngrok).
 * @param sandbox - Override sandbox mode (e.g. from billing settings).
 */
export async function getPaidOrdersByExternalId(
  userId: string,
  options?: { sandbox?: boolean }
): Promise<PolarOrderFromApi[]> {
  if (!isPolarConfigured()) return [];

  try {
    const polar = getPolarClient(options?.sandbox ? "sandbox" : undefined);
    const collected: PolarOrderFromApi[] = [];
    const iterator = await polar.orders.list({
      externalCustomerId: userId,
      productBillingType: "one_time",
      limit: 100,
    });

    for await (const page of iterator) {
      const items = (page as { result?: { items?: PolarOrderFromApi[] } })
        ?.result?.items;
      if (!Array.isArray(items)) continue;
      for (const o of items) {
        const order = o as PolarOrderFromApi & Record<string, unknown>;
        const productId = order.productId ?? order.product_id;
        if (order.paid && productId) {
          collected.push({
            id: order.id,
            productId: productId as string,
            totalAmount: (order.totalAmount ?? order.total_amount ?? 0) as number,
            currency: (order.currency ?? "usd") as string,
            paid: true,
            customerId: (order.customerId ?? order.customer_id ?? "") as string,
            customer: order.customer,
            modifiedAt: (order.modifiedAt ?? order.modified_at ?? null) as Date | null,
            createdAt: (order.createdAt ?? order.created_at ?? new Date()) as Date,
            product: order.product,
          });
        }
      }
    }
    return collected;
  } catch {
    return [];
  }
}

/** Build checkout URL. Pass product IDs as comma-separated string. */
export function getCheckoutUrl(options: {
  products: string;
  customerEmail?: string;
  customerExternalId?: string;
  metadata?: Record<string, string>;
}) {
  const url = new URL("/api/polar/checkout", getCanonicalOrigin());
  url.searchParams.set("products", options.products);
  if (options.customerEmail)
    url.searchParams.set("customerEmail", options.customerEmail);
  if (options.customerExternalId)
    url.searchParams.set("customerExternalId", options.customerExternalId);
  if (options.metadata)
    url.searchParams.set("metadata", encodeURIComponent(JSON.stringify(options.metadata)));
  return url.toString();
}
