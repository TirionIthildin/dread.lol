/**
 * POST: get or create the single unlimited redemption link for the creator-program badge.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { assertVerifiedCreator } from "@/lib/creator-program";
import { getCreatorProgramBadge } from "@/lib/user-created-badge";
import { ensureCreatorRedemptionLink } from "@/lib/badge-redemption";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }
  const gate = await assertVerifiedCreator(session.sub);
  if ("error" in gate) {
    return NextResponse.json({ error: gate.error }, { status: 403 });
  }

  const badge = await getCreatorProgramBadge(session.sub);
  if (!badge) {
    return NextResponse.json({ error: "Create your creator badge first" }, { status: 400 });
  }

  const result = await ensureCreatorRedemptionLink(session.sub, badge.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ url: result.url, token: result.token });
}
