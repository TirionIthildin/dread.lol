/**
 * Polar Checkout – starts a Polar checkout session.
 * Call with ?products=PRODUCT_ID&customerExternalId=USER_ID (or use checkout-redirect to inject user id).
 * Respects admin billing settings (enabled, sandbox).
 */
import { NextRequest, NextResponse } from "next/server";
import { Checkout } from "@polar-sh/nextjs";
import { getBillingSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

const successUrl = `${SITE_URL}/dashboard?polar=success&checkout_id={CHECKOUT_ID}`;
const returnUrl = SITE_URL;

export async function GET(request: NextRequest) {
  const billing = await getBillingSettings();
  if (!billing.enabled) {
    return NextResponse.redirect(`${SITE_URL}/dashboard?error=checkout_unavailable`, 302);
  }

  const polarCheckoutHandler = Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    successUrl,
    returnUrl,
    server: billing.sandbox ? "sandbox" : "production",
  });
  return polarCheckoutHandler(request);
}
