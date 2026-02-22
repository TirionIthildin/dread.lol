/**
 * Redirect authenticated user to Polar Customer Portal.
 * Respects admin billing settings (enabled, sandbox).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getBillingSettings } from "@/lib/settings";
import { getOriginFromRequest } from "@/lib/site";

export async function GET(request: NextRequest) {
  const origin = getOriginFromRequest(request);
  const billing = await getBillingSettings();
  if (!billing.enabled) {
    return NextResponse.redirect(`${origin}/dashboard?error=portal_unavailable`, 302);
  }

  const apiBase = billing.sandbox ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";

  const session = await getSession();
  if (!session?.sub) {
    const returnPath = encodeURIComponent("/api/polar/customer-portal");
    return NextResponse.redirect(
      `${origin}/dashboard?auth=required&return=${returnPath}`,
      302
    );
  }

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const res = await fetch(`${apiBase}/v1/customer-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_customer_id: session.sub,
      return_url: `${origin}/dashboard`,
    }),
  });

  if (!res.ok) {
    return NextResponse.redirect(`${origin}/dashboard?error=portal_unavailable`, 302);
  }

  const data = (await res.json()) as { customer_portal_url?: string };
  const portalUrl = data?.customer_portal_url;
  if (!portalUrl || typeof portalUrl !== "string") {
    return NextResponse.redirect(`${origin}/dashboard?error=portal_unavailable`, 302);
  }

  return NextResponse.redirect(portalUrl, 302);
}
