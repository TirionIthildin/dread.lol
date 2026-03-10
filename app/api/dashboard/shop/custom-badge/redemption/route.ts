/**
 * POST: create a badge redemption link.
 * Body: { badgeId: string, maxRedemptions?: number | null, expiresAt?: string }
 * maxRedemptions: null = unlimited (default). Omit for multi-use unlimited.
 * expiresAt: ISO date string. Optional.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { getCustomBadgeAddonCount } from "@/lib/custom-badge-addon";
import { createRedemptionLink } from "@/lib/badge-redemption";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const slotCount = await getCustomBadgeAddonCount(session.sub);
  if (slotCount === 0) {
    return NextResponse.json({ error: "Custom badge addon required" }, { status: 403 });
  }

  let body: { badgeId?: string; maxRedemptions?: number | null; expiresAt?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const badgeId = typeof body.badgeId === "string" ? body.badgeId.trim() : "";
  if (!badgeId) {
    return NextResponse.json({ error: "badgeId is required" }, { status: 400 });
  }

  const options: { maxRedemptions?: number | null; expiresAt?: Date | null } = {};
  if (body.maxRedemptions != null) {
    const n = typeof body.maxRedemptions === "number" ? body.maxRedemptions : parseInt(String(body.maxRedemptions), 10);
    options.maxRedemptions = Number.isFinite(n) && n > 0 ? n : null;
  } else {
    options.maxRedemptions = null; // default: unlimited
  }
  if (typeof body.expiresAt === "string" && body.expiresAt.trim()) {
    const d = new Date(body.expiresAt);
    options.expiresAt = Number.isNaN(d.getTime()) ? null : d;
  }

  const result = await createRedemptionLink(session.sub, badgeId, options);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ url: result.url, token: result.token });
}
