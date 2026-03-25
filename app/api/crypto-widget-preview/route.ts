import { NextRequest, NextResponse } from "next/server";
import { getCryptoWidgetData } from "@/lib/crypto-widgets";

/**
 * GET ?chain=ethereum&address=0x… — server-side native balance for dashboard preview.
 */
export async function GET(req: NextRequest) {
  const chain = req.nextUrl.searchParams.get("chain");
  const address = req.nextUrl.searchParams.get("address");
  const data = await getCryptoWidgetData(chain, address);
  if (!data) return NextResponse.json(null);
  return NextResponse.json(data);
}
