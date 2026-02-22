/**
 * Redirects authenticated user to Polar checkout with customerExternalId = userId.
 * Uses admin billing settings for product ID. Used by "Subscribe" / "Buy" buttons.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getBillingSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

export async function GET(request: NextRequest) {
  const billing = await getBillingSettings();
  if (!billing.enabled) {
    return NextResponse.redirect(`${SITE_URL}/dashboard?error=checkout_unavailable`, 302);
  }

  const productId =
    billing.productId ??
    request.nextUrl.searchParams.get("product") ??
    process.env.POLAR_PRODUCT_ID;

  if (!productId) {
    return NextResponse.redirect(
      `${SITE_URL}/dashboard?error=checkout_unavailable&reason=no_product`,
      302
    );
  }

  const session = await getSession();
  if (!session) {
    const returnPath = encodeURIComponent("/api/polar/checkout-redirect");
    return NextResponse.redirect(
      `${SITE_URL}/dashboard?auth=required&return=${returnPath}`,
      302
    );
  }

  const url = new URL("/api/polar/checkout", SITE_URL);
  url.searchParams.set("products", productId);
  url.searchParams.set("customerExternalId", session.sub);

  return NextResponse.redirect(url.toString(), 302);
}
