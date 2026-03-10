/**
 * Admin-only: create a Premium voucher link.
 * POST Body: { creatorId: string, maxRedemptions?: number | null, expiresAt?: string, label?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import { createPremiumVoucherLink } from "@/lib/premium-voucher";

export async function POST(request: NextRequest) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  let body: { creatorId?: string; maxRedemptions?: number | null; expiresAt?: string; label?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const creatorId = typeof body.creatorId === "string" ? body.creatorId.trim() : "";
  if (!creatorId) {
    return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
  }

  const options: { maxRedemptions?: number | null; expiresAt?: Date | null; label?: string | null } = {};
  if (body.maxRedemptions != null) {
    const n = typeof body.maxRedemptions === "number" ? body.maxRedemptions : parseInt(String(body.maxRedemptions), 10);
    options.maxRedemptions = Number.isFinite(n) && n > 0 ? n : null;
  }
  if (typeof body.expiresAt === "string" && body.expiresAt.trim()) {
    const d = new Date(body.expiresAt);
    options.expiresAt = Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof body.label === "string") {
    options.label = body.label.trim() || null;
  }

  const result = await createPremiumVoucherLink(creatorId, options);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ url: result.url, token: result.token });
}
