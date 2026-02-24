import { NextRequest, NextResponse } from "next/server";
import { generateState, getAuthorizeUrl } from "@/lib/auth/discord";
import { setOAuthState } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function GET(request: NextRequest) {
  try {
    const state = generateState();
    await setOAuthState(state, "");
    const url = getAuthorizeUrl({ state });
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth config error";
    logger.error("DiscordAuth", "OAuth start error:", err);
    const base = getBaseUrl(request);
    const params = new URLSearchParams({ error: "oauth_config", message });
    return NextResponse.redirect(new URL(`/dashboard?${params}`, base));
  }
}
