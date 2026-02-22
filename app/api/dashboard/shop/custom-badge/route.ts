/**
 * GET: fetch user's created badge (requires custom badge addon)
 * PATCH: create/update user's badge
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { hasCustomBadgeAddon } from "@/lib/custom-badge-addon";
import { getUserCreatedBadge, upsertUserCreatedBadge } from "@/lib/user-created-badge";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const hasAddon = await hasCustomBadgeAddon(session.sub);
  if (!hasAddon) {
    return NextResponse.json({ error: "Custom badge addon required" }, { status: 403 });
  }

  const badge = await getUserCreatedBadge(session.sub);
  return NextResponse.json({ badge });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const hasAddon = await hasCustomBadgeAddon(session.sub);
  if (!hasAddon) {
    return NextResponse.json({ error: "Custom badge addon required" }, { status: 403 });
  }

  let body: { label?: string; description?: string; color?: string; badgeType?: string; imageUrl?: string; iconName?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label || label.length > 50) {
    return NextResponse.json({ error: "Label is required (max 50 chars)" }, { status: 400 });
  }

  const badge = await upsertUserCreatedBadge(session.sub, {
    label,
    description: body.description ?? undefined,
    color: body.color ?? undefined,
    badgeType: body.badgeType === "image" || body.badgeType === "icon" ? body.badgeType : "label",
    imageUrl: body.imageUrl ?? undefined,
    iconName: body.iconName ?? undefined,
  });

  return NextResponse.json({ badge });
}
