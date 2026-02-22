import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import { getBillingSettings, setSetting } from "@/lib/settings";

export async function GET() {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const billing = await getBillingSettings();
  return NextResponse.json({
    billing: {
      enabled: billing.enabled,
      productId: billing.productId,
      sandbox: billing.sandbox,
      polarConfigured: billing.polarConfigured,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  let body: { billing?: { enabled?: boolean; productId?: string | null; sandbox?: boolean } } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const billing = body.billing;
  if (billing) {
    if (typeof billing.enabled === "boolean") {
      await setSetting("billing.enabled", billing.enabled);
    }
    if (billing.productId !== undefined) {
      await setSetting(
        "billing.productId",
        typeof billing.productId === "string" ? billing.productId.trim() || null : null
      );
    }
    if (typeof billing.sandbox === "boolean") {
      await setSetting("billing.sandbox", billing.sandbox);
    }
  }

  const updated = await getBillingSettings();
  return NextResponse.json({
    billing: {
      enabled: updated.enabled,
      productId: updated.productId,
      sandbox: updated.sandbox,
      polarConfigured: updated.polarConfigured,
    },
  });
}
