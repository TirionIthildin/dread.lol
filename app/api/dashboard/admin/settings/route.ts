import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import { getBillingSettings, setSetting } from "@/lib/settings";
import { getProductsWithTypes, formatPrice } from "@/lib/polar-products";

export async function GET() {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const billing = await getBillingSettings();

  let basicPriceFormatted: string | null = null;
  if (billing.basicProductIds.length > 0) {
    const basicMap = await getProductsWithTypes(billing.basicProductIds, {
      sandbox: billing.sandbox,
    });
    const first = billing.basicProductIds[0];
    const info = first ? basicMap.get(first) : null;
    basicPriceFormatted = info?.price ? formatPrice(info.price) : null;
  }

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
      basicPriceFormatted,
      basicTrialDays: billing.basicTrialDays,
      galleryMaxFree: billing.galleryMaxFree,
      blogPremiumOnly: billing.blogPremiumOnly,
      pasteMaxFreePerMonth: billing.pasteMaxFreePerMonth,
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
      basicTrialDays?: number;
      galleryMaxFree?: number;
      blogPremiumOnly?: boolean;
      pasteMaxFreePerMonth?: number;
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
    if (billing.basicTrialDays !== undefined && typeof billing.basicTrialDays === "number") {
      await setSetting("billing.basicTrialDays", Math.max(0, Math.round(billing.basicTrialDays)));
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
  }

  const updated = await getBillingSettings();
  let basicPriceFormatted: string | null = null;
  if (updated.basicProductIds.length > 0) {
    const basicMap = await getProductsWithTypes(updated.basicProductIds, {
      sandbox: updated.sandbox,
    });
    const first = updated.basicProductIds[0];
    const info = first ? basicMap.get(first) : null;
    basicPriceFormatted = info?.price ? formatPrice(info.price) : null;
  }
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
      basicPriceFormatted,
    },
  });
}
