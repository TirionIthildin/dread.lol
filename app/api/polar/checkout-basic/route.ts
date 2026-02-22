/**
 * Redirects authenticated user to Polar checkout for Basic product ($4 one-time).
 * Used by unapproved users to pay for account creation.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getBillingSettings } from "@/lib/settings";
import { getOriginFromRequest } from "@/lib/site";

export async function GET(request: NextRequest) {
  const origin = getOriginFromRequest(request);
  const billing = await getBillingSettings();
  if (!billing.basicEnabled || !billing.basicProductId) {
    return NextResponse.redirect(
      `${origin}/dashboard?error=checkout_unavailable&reason=basic_not_configured`,
      302
    );
  }

  const session = await getSession();
  if (!session) {
    const returnPath = encodeURIComponent("/api/polar/checkout-basic");
    return NextResponse.redirect(
      `${origin}/dashboard?auth=required&return=${returnPath}`,
      302
    );
  }

  const url = new URL("/api/polar/checkout", origin);
  url.searchParams.set("products", billing.basicProductId);
  url.searchParams.set("customerExternalId", session.sub);

  return NextResponse.redirect(url.toString(), 302);
}
