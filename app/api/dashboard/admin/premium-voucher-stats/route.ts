/**
 * Admin-only: get Premium voucher redemption stats per creator and per link.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import { getPremiumVoucherStats } from "@/lib/premium-voucher";

export async function GET() {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  const stats = await getPremiumVoucherStats();
  return NextResponse.json(stats);
}
