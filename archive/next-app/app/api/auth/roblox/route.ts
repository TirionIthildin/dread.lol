import { NextRequest, NextResponse } from "next/server";
import { generateState, getAuthorizeUrl } from "@/lib/auth/roblox";
import { redirectAuthToCanonicalOrigin } from "@/lib/auth/subdomain-canonical";
import { setOAuthState } from "@/lib/auth/session";
import { rateLimitByIp } from "@/lib/rate-limit";
import { getCanonicalOrigin } from "@/lib/site";

const AUTH_START_LIMIT = 10;
const AUTH_START_WINDOW = 60;

/** GET: Redirect to Roblox OAuth to link account. */
export async function GET(request: NextRequest) {
  const subdomainRedirect = redirectAuthToCanonicalOrigin(request);
  if (subdomainRedirect) return subdomainRedirect;

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
    const base = getCanonicalOrigin();
    const params = new URLSearchParams({ error: "roblox_oauth", message });
    return NextResponse.redirect(new URL(`/dashboard?${params}`, base));
  }
}
