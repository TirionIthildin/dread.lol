import { NextRequest, NextResponse } from "next/server";
import { getCryptoWidgetData } from "@/lib/crypto-widgets";

/**
 * GET ?ethereum=&bitcoin=&solana= — server-side native balances for dashboard preview.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getCryptoWidgetData({
    cryptoWalletEthereum: sp.get("ethereum"),
    cryptoWalletBitcoin: sp.get("bitcoin"),
    cryptoWalletSolana: sp.get("solana"),
  });
  if (!data || data.length === 0) return NextResponse.json(null);
  return NextResponse.json(data);
}
