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
      tierName: billing.tierName,
      productId: billing.productId,
      sandbox: billing.sandbox,
      polarConfigured: billing.polarConfigured,
      basicEnabled: billing.basicEnabled,
      basicProductId: billing.basicProductId,
      basicTierName: billing.basicTierName,
      basicPriceCents: billing.basicPriceCents,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  let body: {
    billing?: {
      enabled?: boolean;
      tierName?: string;
      productId?: string | null;
      sandbox?: boolean;
      basicEnabled?: boolean;
      basicProductId?: string | null;
      basicTierName?: string;
      basicPriceCents?: number;
    };
  } = {};
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
    if (billing.tierName !== undefined && typeof billing.tierName === "string") {
      await setSetting("billing.tierName", billing.tierName.trim() || "Premium");
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
    if (typeof billing.basicEnabled === "boolean") {
      await setSetting("billing.basicEnabled", billing.basicEnabled);
    }
    if (billing.basicProductId !== undefined) {
      await setSetting(
        "billing.basicProductId",
        typeof billing.basicProductId === "string" ? billing.basicProductId.trim() || null : null
      );
    }
    if (billing.basicTierName !== undefined && typeof billing.basicTierName === "string") {
      await setSetting("billing.basicTierName", billing.basicTierName.trim() || "Basic");
    }
    if (billing.basicPriceCents !== undefined && typeof billing.basicPriceCents === "number") {
      await setSetting("billing.basicPriceCents", Math.max(0, Math.round(billing.basicPriceCents)));
    }
  }

  const updated = await getBillingSettings();
  return NextResponse.json({
    billing: {
      enabled: updated.enabled,
      tierName: updated.tierName,
      productId: updated.productId,
      sandbox: updated.sandbox,
      polarConfigured: updated.polarConfigured,
      basicEnabled: updated.basicEnabled,
      basicProductId: updated.basicProductId,
      basicTierName: updated.basicTierName,
      basicPriceCents: updated.basicPriceCents,
    },
  });
}
