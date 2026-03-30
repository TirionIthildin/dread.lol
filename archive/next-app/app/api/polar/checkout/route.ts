/**
 * Polar Checkout – starts a Polar checkout session.
 * Call with ?products=PRODUCT_ID&customerExternalId=USER_ID (or use checkout-redirect to inject user id).
 * Respects admin billing settings (enabled, sandbox).
 */
import { NextRequest, NextResponse } from "next/server";
import { Checkout } from "@polar-sh/nextjs";
import { getBillingSettings } from "@/lib/settings";
import { getCanonicalOrigin } from "@/lib/site";

const DEBUG = process.env.DEBUG_CHECKOUT === "1";

export async function GET(request: NextRequest) {
  const origin = getCanonicalOrigin();
  if (DEBUG) {
    const h = request.headers;
    console.log("[checkout] DEBUG", {
      origin,
      successUrl: `${origin}/dashboard?polar=success&checkout_id={CHECKOUT_ID}`,
      returnUrl: origin,
      env: {
        SITE_URL: process.env.SITE_URL ? "(set)" : "(unset)",
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? "(set)" : "(unset)",
        NODE_ENV: process.env.NODE_ENV,
      },
      headers: {
        host: h.get("host"),
        "x-forwarded-host": h.get("x-forwarded-host"),
        "x-original-host": h.get("x-original-host"),
      },
    });
  }
  const billing = await getBillingSettings();
  if (!billing.enabled) {
    return NextResponse.redirect(`${origin}/dashboard?error=checkout_unavailable`, 302);
  }

  const polarCheckoutHandler = Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    successUrl: `${origin}/dashboard?polar=success&checkout_id={CHECKOUT_ID}`,
    returnUrl: origin,
    server: billing.sandbox ? "sandbox" : "production",
  });
  return polarCheckoutHandler(request);
}
