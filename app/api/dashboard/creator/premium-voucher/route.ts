/**
 * GET: list Premium voucher links for the signed-in verified creator.
 * POST: create a Premium voucher link attributed to the signed-in creator.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { assertVerifiedCreator } from "@/lib/creator-program";
import {
  createPremiumVoucherLink,
  getPremiumVoucherLinksForCreator,
} from "@/lib/premium-voucher";

export async function GET() {
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

  const links = await getPremiumVoucherLinksForCreator(session.sub);
  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
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

  let body: { creatorId?: string; maxRedemptions?: number | null; expiresAt?: string; label?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const options: { maxRedemptions?: number | null; expiresAt?: Date | null; label?: string | null } = {};
  if (body.maxRedemptions != null) {
    const n =
      typeof body.maxRedemptions === "number" ? body.maxRedemptions : parseInt(String(body.maxRedemptions), 10);
    options.maxRedemptions = Number.isFinite(n) && n > 0 ? n : null;
  }
  if (typeof body.expiresAt === "string" && body.expiresAt.trim()) {
    const d = new Date(body.expiresAt);
    options.expiresAt = Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof body.label === "string") {
    options.label = body.label.trim() || null;
  }

  const result = await createPremiumVoucherLink(session.sub, options);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ url: result.url, token: result.token });
}
