/**
 * Admin-only: Fetch Polar product details for configured IDs.
 * Used by Shop admin UI to show product names and validate IDs.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import { getProductsWithTypes, formatPrice, type PolarProductInfo } from "@/lib/polar-products";

export async function GET(request: NextRequest) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const sandbox = searchParams.get("sandbox") === "true";
  const productIds = idsParam
    ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (productIds.length === 0) {
    return NextResponse.json({ products: {} });
  }

  const productMap = await getProductsWithTypes(productIds, { sandbox });
  const products: Record<string, { name: string; price: string; isRecurring: boolean }> = {};
  for (const id of productIds) {
    const info: PolarProductInfo | undefined = productMap.get(id);
    if (info) {
      products[id] = {
        name: info.name,
        price: formatPrice(info.price),
        isRecurring: info.isRecurring,
      };
    }
  }
  return NextResponse.json({ products });
}
