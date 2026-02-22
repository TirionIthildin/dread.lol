/**
 * GET: fetch user's created badges (requires custom badge addon)
 * PATCH: create or update a badge
 * DELETE: remove a badge (?id=badgeId)
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { getCustomBadgeAddonCount } from "@/lib/custom-badge-addon";
import { getUserCreatedBadges, createUserCreatedBadge, updateUserCreatedBadge, deleteUserCreatedBadge } from "@/lib/user-created-badge";

export async function GET() {
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

  const badges = await getUserCreatedBadges(session.sub);
  return NextResponse.json({ badges, slotCount });
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

  const [slotCount, existingBadges] = await Promise.all([
    getCustomBadgeAddonCount(session.sub),
    getUserCreatedBadges(session.sub),
  ]);
  if (slotCount === 0) {
    return NextResponse.json({ error: "Custom badge addon required" }, { status: 403 });
  }

  let body: { badgeId?: string; label?: string; description?: string; color?: string; badgeType?: string; imageUrl?: string; iconName?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label || label.length > 50) {
    return NextResponse.json({ error: "Label is required (max 50 chars)" }, { status: 400 });
  }

  const badgeId = typeof body.badgeId === "string" ? body.badgeId.trim() : null;

  if (badgeId) {
    const badge = await updateUserCreatedBadge(badgeId, session.sub, {
      label,
      description: body.description ?? undefined,
      color: body.color ?? undefined,
      badgeType: body.badgeType === "image" || body.badgeType === "icon" ? body.badgeType : "label",
      imageUrl: body.imageUrl ?? undefined,
      iconName: body.iconName ?? undefined,
    });
    if (!badge) return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    return NextResponse.json({ badge });
  }

  if (existingBadges.length >= slotCount) {
    return NextResponse.json({ error: "No badge slots remaining. Purchase more to add badges." }, { status: 403 });
  }

  const badge = await createUserCreatedBadge(session.sub, {
    label,
    description: body.description ?? undefined,
    color: body.color ?? undefined,
    badgeType: body.badgeType === "image" || body.badgeType === "icon" ? body.badgeType : "label",
    imageUrl: body.imageUrl ?? undefined,
    iconName: body.iconName ?? undefined,
  });
  return NextResponse.json({ badge });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const badgeId = request.nextUrl.searchParams.get("id");
  if (!badgeId) {
    return NextResponse.json({ error: "Missing badge id" }, { status: 400 });
  }

  const ok = await deleteUserCreatedBadge(badgeId, session.sub);
  if (!ok) return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
