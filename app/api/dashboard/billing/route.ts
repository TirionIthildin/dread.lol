/**
 * User billing status. Returns subscription state and whether billing is enabled.
 * Used by dashboard to show Subscribe / Manage links.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { getBillingSettings } from "@/lib/settings";
import { getUserPolarState } from "@/lib/polar-subscription";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const [billing, polarState] = await Promise.all([
    getBillingSettings(),
    getUserPolarState(session.sub),
  ]);

  return NextResponse.json({
    billingEnabled: billing.enabled,
    hasActiveSubscription: polarState.hasActiveSubscription,
    activeSubscription: polarState.activeSubscription,
    ownedProductIds: polarState.ownedProductIds,
  });
}
