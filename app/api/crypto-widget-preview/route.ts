import { NextRequest, NextResponse } from "next/server";
import { getCryptoWidgetData } from "@/lib/crypto-widgets";

/**
 * GET ?ids=bitcoin,ethereum — server-side CoinGecko prices for dashboard preview.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("ids");
  const data = await getCryptoWidgetData(raw ?? undefined);
  if (!data) return NextResponse.json({ coins: [] });
  return NextResponse.json(data);
}
