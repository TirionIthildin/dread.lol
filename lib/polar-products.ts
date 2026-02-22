/**
 * Fetch product info from Polar API. Used to determine subscription vs one-time
 * and prices for checkout and UI without manual configuration.
 */
import { isPolarConfigured, getPolarClient } from "@/lib/polar";

export interface PolarProductPrice {
  /** Amount in cents. null for free/custom. */
  amountCents: number | null;
  currency: string;
  /** e.g. "month", "year" for recurring; null for one-time. */
  recurringInterval: string | null;
  /** "fixed" | "free" | "custom" */
  amountType: string;
}

export interface PolarProductInfo {
  id: string;
  name: string;
  isRecurring: boolean;
  /** First non-archived price, or null if none. */
  price: PolarProductPrice | null;
  /** All non-archived prices (for products with multiple plans). */
  prices: PolarProductPrice[];
}

const cache = new Map<string, { data: PolarProductInfo; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(id: string, sandbox: boolean): string {
  return `${sandbox ? "sandbox" : "prod"}:${id}`;
}

/**
 * Fetch a single product from Polar API. Returns null if not found or Polar not configured.
 */
export async function getProductInfo(
  productId: string,
  options?: { sandbox?: boolean }
): Promise<PolarProductInfo | null> {
  if (!isPolarConfigured() || !productId?.trim()) return null;
  const key = cacheKey(productId.trim(), options?.sandbox ?? false);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  try {
    const polar = getPolarClient(options?.sandbox ? "sandbox" : undefined);
    const product = await polar.products.get({ id: productId.trim() });
    const data = product as unknown as {
      id?: string;
      name?: string;
      is_recurring?: boolean;
      isRecurring?: boolean;
      prices?: Array<{
        amount_type?: string;
        is_archived?: boolean;
        price_amount?: number;
        price_currency?: string;
        recurring_interval?: string | null;
        minimum_amount?: number;
        preset_amount?: number | null;
      }>;
    };
    const prices = parsePrices(data.prices);
    const info: PolarProductInfo = {
      id: data.id ?? productId,
      name: data.name ?? productId,
      isRecurring: data.is_recurring ?? data.isRecurring ?? false,
      price: prices[0] ?? null,
      prices,
    };
    cache.set(key, { data: info, expires: Date.now() + CACHE_TTL_MS });
    return info;
  } catch {
    return null;
  }
}

function parsePrices(
  raw?: unknown
): PolarProductPrice[] {
  if (!Array.isArray(raw)) return [];
  const result: PolarProductPrice[] = [];
  for (const p of raw) {
    const pr = p as Record<string, unknown>;
    if (pr.is_archived === true) continue;
    const amountType = String(pr.amount_type ?? "fixed");
    const currency = (String(pr.price_currency ?? "usd")).toUpperCase();
    const recurringInterval =
      pr.recurring_interval != null ? String(pr.recurring_interval) : null;
    let amountCents: number | null = null;
    if (amountType === "fixed" && typeof pr.price_amount === "number") {
      amountCents = Math.round(pr.price_amount);
    } else if (amountType === "free") {
      amountCents = 0;
    } else if (amountType === "custom") {
      const preset = pr.preset_amount;
      const min = pr.minimum_amount;
      amountCents =
        typeof preset === "number"
          ? Math.round(preset)
          : typeof min === "number"
            ? Math.round(min)
            : null;
    }
    result.push({
      amountCents,
      currency,
      recurringInterval,
      amountType,
    });
  }
  return result;
}

/**
 * Fetch multiple products. Returns a map of productId -> info. Skips missing/failed.
 */
export async function getProductsWithTypes(
  productIds: string[],
  options?: { sandbox?: boolean }
): Promise<Map<string, PolarProductInfo>> {
  const result = new Map<string, PolarProductInfo>();
  if (!isPolarConfigured() || productIds.length === 0) return result;

  await Promise.all(
    productIds
      .map((id) => id.trim())
      .filter(Boolean)
      .map(async (id) => {
        const info = await getProductInfo(id, options);
        if (info) result.set(id, info);
      })
  );
  return result;
}

/**
 * Format a price for display (e.g. "$4", "$9.99/month", "Free").
 */
export function formatPrice(p: PolarProductPrice | null): string {
  if (!p) return "";
  if (p.amountType === "free" || p.amountCents === 0) return "Free";
  if (p.amountCents == null) return "Pay what you want";
  const amount = p.amountCents / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: p.currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
  if (p.recurringInterval) {
    const interval = p.recurringInterval === "month" ? "/month" : p.recurringInterval === "year" ? "/year" : `/${p.recurringInterval}`;
    return `${formatted}${interval}`;
  }
  return formatted;
}

/**
 * Get first subscription product ID from the list, or first one-time, or first any.
 */
export function pickProductForCheckout(
  productIds: string[],
  productMap: Map<string, PolarProductInfo>,
  prefer: "recurring" | "one_time"
): string | null {
  if (productIds.length === 0) return null;
  const subs = productIds.filter((id) => productMap.get(id)?.isRecurring);
  const oneTime = productIds.filter((id) => !productMap.get(id)?.isRecurring);
  if (prefer === "recurring" && subs.length > 0) return subs[0] ?? null;
  if (prefer === "one_time" && oneTime.length > 0) return oneTime[0] ?? null;
  return productIds[0] ?? null;
}
