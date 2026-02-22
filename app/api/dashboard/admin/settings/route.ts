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
      galleryMaxFree: billing.galleryMaxFree,
      blogPremiumOnly: billing.blogPremiumOnly,
      pasteMaxFreePerMonth: billing.pasteMaxFreePerMonth,
      customBadgeProductIds: billing.customBadgeProductIds,
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
      galleryMaxFree?: number;
      blogPremiumOnly?: boolean;
      pasteMaxFreePerMonth?: number;
      customBadgeProductIds?: string[];
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
    if (billing.galleryMaxFree !== undefined && typeof billing.galleryMaxFree === "number") {
      await setSetting("billing.galleryMaxFree", Math.max(0, Math.round(billing.galleryMaxFree)));
    }
    if (typeof billing.blogPremiumOnly === "boolean") {
      await setSetting("billing.blogPremiumOnly", billing.blogPremiumOnly);
    }
    if (billing.pasteMaxFreePerMonth !== undefined && typeof billing.pasteMaxFreePerMonth === "number") {
      await setSetting("billing.pasteMaxFreePerMonth", Math.max(0, Math.round(billing.pasteMaxFreePerMonth)));
    }
    if (billing.customBadgeProductIds !== undefined && Array.isArray(billing.customBadgeProductIds)) {
      const ids = billing.customBadgeProductIds.map((id) => String(id).trim()).filter(Boolean);
      await setSetting("billing.customBadgeProductIds", ids);
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
      galleryMaxFree: updated.galleryMaxFree,
      blogPremiumOnly: updated.blogPremiumOnly,
      pasteMaxFreePerMonth: updated.pasteMaxFreePerMonth,
      customBadgeProductIds: updated.customBadgeProductIds,
    },
  });
}
