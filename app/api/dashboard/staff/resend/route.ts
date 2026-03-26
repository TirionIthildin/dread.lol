import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/[locale]/dashboard/actions";
import { getResendAdminSnapshot } from "@/lib/email/resend";

/** GET: Resend configuration status for admin (no secrets). */
export async function GET() {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  const snapshot = getResendAdminSnapshot();
  return NextResponse.json({
    resend: {
      ...snapshot,
      /** Display hint: `re_••••abcd` when configured */
      apiKeyHint: snapshot.apiKeyConfigured
        ? `re_${"•".repeat(Math.max(0, 8))}${snapshot.apiKeySuffix ?? ""}`
        : null,
    },
  });
}
