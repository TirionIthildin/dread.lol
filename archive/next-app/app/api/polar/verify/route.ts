import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { verifyCheckout } from "@/lib/polar-verify";

/** POST: Verify a checkout by ID (redirect-based flow, no webhooks). */
export async function POST(request: NextRequest) {
  const session = await getSession();
  let checkoutId: string | undefined;
  try {
    const body = await request.json();
    checkoutId = typeof body?.checkoutId === "string" ? body.checkoutId.trim() : undefined;
  } catch {
    // empty body
  }
  if (!checkoutId) {
    return NextResponse.json({ error: "checkoutId required" }, { status: 400 });
  }

  const result = await verifyCheckout(checkoutId, session?.sub ?? null);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Verification failed" },
      { status: 400 }
    );
  }
  return NextResponse.json({
    ok: true,
    alreadyProcessed: result.alreadyProcessed ?? false,
  });
}
