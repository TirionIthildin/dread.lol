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
      productIds: billing.productIds,
      sandbox: billing.sandbox,
      polarConfigured: billing.polarConfigured,
      basicEnabled: billing.basicEnabled,
      basicProductIds: billing.basicProductIds,
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
      productIds?: string[];
      sandbox?: boolean;
      basicEnabled?: boolean;
      basicProductIds?: string[];
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
    if (billing.productIds !== undefined && Array.isArray(billing.productIds)) {
      const ids = billing.productIds.map((id) => String(id).trim()).filter(Boolean);
      await setSetting("billing.productIds", ids);
    }
    if (typeof billing.sandbox === "boolean") {
      await setSetting("billing.sandbox", billing.sandbox);
    }
    if (typeof billing.basicEnabled === "boolean") {
      await setSetting("billing.basicEnabled", billing.basicEnabled);
    }
    if (billing.basicProductIds !== undefined && Array.isArray(billing.basicProductIds)) {
      const ids = billing.basicProductIds.map((id) => String(id).trim()).filter(Boolean);
      await setSetting("billing.basicProductIds", ids);
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
      productIds: updated.productIds,
      sandbox: updated.sandbox,
      polarConfigured: updated.polarConfigured,
      basicEnabled: updated.basicEnabled,
      basicProductIds: updated.basicProductIds,
      basicTierName: updated.basicTierName,
      basicPriceCents: updated.basicPriceCents,
    },
  });
}
