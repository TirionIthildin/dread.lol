/**
 * GET: creator program badge (Verified Creator only).
 * PATCH: create or update the single creator-program badge (no addon required).
 * DELETE: remove creator badge and its redemption links.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import { assertVerifiedCreator } from "@/lib/creator-program";
import {
  getCreatorProgramBadge,
  createUserCreatedBadge,
  updateUserCreatedBadge,
  deleteUserCreatedBadge,
} from "@/lib/user-created-badge";
import { deleteRedemptionLinksForBadge } from "@/lib/badge-redemption";

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
  const badge = await getCreatorProgramBadge(session.sub);
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
  const gate = await assertVerifiedCreator(session.sub);
  if ("error" in gate) {
    return NextResponse.json({ error: gate.error }, { status: 403 });
  }

  let body: {
    badgeId?: string;
    label?: string;
    description?: string;
    color?: string;
    badgeType?: string;
    imageUrl?: string;
    iconName?: string;
  } = {};
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
  const existing = await getCreatorProgramBadge(session.sub);

  if (badgeId) {
    if (!existing || existing.id !== badgeId) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }
    const badge = await updateUserCreatedBadge(badgeId, session.sub, {
      label,
      description: body.description ?? undefined,
      color: body.color ?? undefined,
      badgeType: body.badgeType === "image" || body.badgeType === "icon" ? body.badgeType : "label",
      imageUrl: body.imageUrl ?? undefined,
      iconName: body.iconName ?? undefined,
    });
    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }
    return NextResponse.json({ badge });
  }

  if (existing) {
    return NextResponse.json({ error: "Creator badge already exists" }, { status: 403 });
  }

  const badge = await createUserCreatedBadge(session.sub, {
    label,
    description: body.description ?? undefined,
    color: body.color ?? undefined,
    badgeType: body.badgeType === "image" || body.badgeType === "icon" ? body.badgeType : "label",
    imageUrl: body.imageUrl ?? undefined,
    iconName: body.iconName ?? undefined,
    creatorProgram: true,
  });
  if (!badge) {
    return NextResponse.json({ error: "Failed to create badge" }, { status: 500 });
  }
  return NextResponse.json({ badge });
}

export async function DELETE() {
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

  const existing = await getCreatorProgramBadge(session.sub);
  if (!existing) {
    return NextResponse.json({ error: "No creator badge" }, { status: 404 });
  }

  await deleteRedemptionLinksForBadge(existing.id, session.sub);
  const ok = await deleteUserCreatedBadge(existing.id, session.sub);
  if (!ok) {
    return NextResponse.json({ error: "Failed to delete badge" }, { status: 400 });
  }
  return NextResponse.json({ deleted: true });
}
