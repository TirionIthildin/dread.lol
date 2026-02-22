/**
 * Redirects authenticated user to Polar checkout with customerExternalId = userId.
 * Uses admin billing settings for product ID. Used by "Subscribe" / "Buy" buttons.
 * ?product=prod_xxx - use specific product
 * ?prefer=recurring - use first subscription product (auto-detected from Polar API)
 * ?prefer=one_time - use first one-time product
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getBillingSettings } from "@/lib/settings";
import { getCanonicalOrigin } from "@/lib/site";
import {
  getProductsWithTypes,
  pickProductForCheckout,
} from "@/lib/polar-products";

const DEBUG = process.env.DEBUG_CHECKOUT === "1";

export async function GET(request: NextRequest) {
  const origin = getCanonicalOrigin();
  if (DEBUG) {
    const h = request.headers;
    console.log("[checkout-redirect] DEBUG", {
      origin,
      redirectTarget: `${origin}/api/polar/checkout`,
      env: {
        SITE_URL: process.env.SITE_URL ? "(set)" : "(unset)",
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? "(set)" : "(unset)",
        NODE_ENV: process.env.NODE_ENV,
      },
      headers: {
        host: h.get("host"),
        "x-forwarded-host": h.get("x-forwarded-host"),
        "x-original-host": h.get("x-original-host"),
        "x-forwarded-proto": h.get("x-forwarded-proto"),
      },
    });
  }
  const billing = await getBillingSettings();
  if (!billing.enabled) {
    return NextResponse.redirect(`${origin}/dashboard?error=checkout_unavailable`, 302);
  }

  const explicitProduct = request.nextUrl.searchParams.get("product");
  const prefer = request.nextUrl.searchParams.get("prefer") as "recurring" | "one_time" | null;

  let productId: string | null = explicitProduct ?? null;

  if (!productId && billing.productIds.length > 0) {
    if (prefer === "recurring" || prefer === "one_time") {
      const productMap = await getProductsWithTypes(billing.productIds, {
        sandbox: billing.sandbox,
      });
      productId = pickProductForCheckout(billing.productIds, productMap, prefer);
    }
    if (!productId) {
      productId = billing.productIds[0] ?? null;
    }
  }

  if (!productId) {
    return NextResponse.redirect(
      `${origin}/dashboard?error=checkout_unavailable&reason=no_product`,
      302
    );
  }

  const session = await getSession();
  if (!session) {
    const returnPath = encodeURIComponent("/api/polar/checkout-redirect");
    return NextResponse.redirect(
      `${origin}/dashboard?auth=required&return=${returnPath}`,
      302
    );
  }

  const url = new URL("/api/polar/checkout", origin);
  url.searchParams.set("products", productId);
  url.searchParams.set("customerExternalId", session.sub);
  const redirectTo = url.toString();
  if (DEBUG) {
    console.log("[checkout-redirect] Redirecting to", redirectTo);
  }
  return NextResponse.redirect(redirectTo, 302);
}
