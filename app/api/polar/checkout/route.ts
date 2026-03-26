/**
 * Polar Checkout – starts a Polar checkout session.
 * Call with ?products=PRODUCT_ID&customerExternalId=USER_ID (or use checkout-redirect to inject user id).
 * Respects admin billing settings (enabled, sandbox).
 */
import { NextRequest, NextResponse } from "next/server";
import { Checkout } from "@polar-sh/nextjs";
import { getBillingSettings } from "@/lib/settings";
import { getCanonicalOrigin } from "@/lib/site";

export async function GET(request: NextRequest) {
  const origin = getCanonicalOrigin();
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
