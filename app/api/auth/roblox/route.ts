import { NextRequest, NextResponse } from "next/server";
import { generateState, getAuthorizeUrl } from "@/lib/auth/roblox";
import { setOAuthState } from "@/lib/auth/session";
import { rateLimitByIp } from "@/lib/rate-limit";

const AUTH_START_LIMIT = 10;
const AUTH_START_WINDOW = 60;

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  const u = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return u.replace(/\/$/, "");
}

/** GET: Redirect to Roblox OAuth to link account. */
export async function GET(request: NextRequest) {
  const limit = await rateLimitByIp(request, "auth-roblox", AUTH_START_LIMIT, AUTH_START_WINDOW);
  if (!limit.allowed) return limit.response;

  try {
    const state = generateState();
    await setOAuthState(state, "", "roblox");
    const url = getAuthorizeUrl({ state });
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth config error";
    console.error("Roblox OAuth start error:", err);
    const base = getBaseUrl(request);
    const params = new URLSearchParams({ error: "roblox_oauth", message });
    return NextResponse.redirect(new URL(`/dashboard?${params}`, base));
  }
}
