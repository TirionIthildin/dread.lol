import { NextRequest, NextResponse } from "next/server";
import { generateState, getAuthorizeUrl } from "@/lib/auth/discord";
import { redirectAuthToCanonicalOrigin } from "@/lib/auth/subdomain-canonical";
import { setOAuthState } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { rateLimitByIp } from "@/lib/rate-limit";
import { getCanonicalOrigin } from "@/lib/site";

const AUTH_START_LIMIT = 10;
const AUTH_START_WINDOW = 60;

export async function GET(request: NextRequest) {
  const subdomainRedirect = redirectAuthToCanonicalOrigin(request);
  if (subdomainRedirect) return subdomainRedirect;

  const limit = await rateLimitByIp(request, "auth-discord", AUTH_START_LIMIT, AUTH_START_WINDOW);
  if (!limit.allowed) return limit.response;

  try {
    const state = generateState();
    await setOAuthState(state, "");
    const url = getAuthorizeUrl({ state });
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth config error";
    logger.error("DiscordAuth", "OAuth start error:", err);
    const base = getCanonicalOrigin();
    const params = new URLSearchParams({ error: "oauth_config", message });
    return NextResponse.redirect(new URL(`/dashboard?${params}`, base));
  }
}
