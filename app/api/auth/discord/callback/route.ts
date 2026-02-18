import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, getUserInfo, getAvatarUrl } from "@/lib/auth/discord";
import {
  consumeOAuthState,
  createSession,
  getSessionCookieConfig,
} from "@/lib/auth/session";

const DASHBOARD_PATH = "/dashboard";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    const desc = searchParams.get("error_description") ?? error;
    return NextResponse.redirect(
      new URL(`/dashboard?error=discord&message=${encodeURIComponent(desc)}`, origin)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=callback_missing", origin)
    );
  }

  const stateConsumed = await consumeOAuthState(state);
  if (stateConsumed === null) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", origin)
    );
  }

  try {
    const tokens = await exchangeCode(code);
    const userInfo = await getUserInfo(tokens.access_token);
    const picture = getAvatarUrl(userInfo);
    const sessionValue = await createSession({
      sub: userInfo.id,
      name: userInfo.global_name ?? userInfo.username,
      preferred_username: userInfo.username,
      profile: `https://discord.com/users/${userInfo.id}`,
      picture,
    });
    const config = getSessionCookieConfig(sessionValue);
    const res = NextResponse.redirect(new URL(DASHBOARD_PATH, origin));
    res.cookies.set(config.name, config.value, {
      httpOnly: config.httpOnly,
      secure: config.secure,
      sameSite: config.sameSite,
      path: config.path,
      maxAge: config.maxAge,
    });
    return res;
  } catch (err) {
    console.error("Discord OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=token_exchange", request.nextUrl.origin)
    );
  }
}
