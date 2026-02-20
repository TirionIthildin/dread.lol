import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, getUserInfo, getAvatarUrl, getUserGuilds } from "@/lib/auth/discord";
import {
  consumeOAuthState,
  createSession,
  getSessionCookieConfig,
} from "@/lib/auth/session";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

const DASHBOARD_PATH = "/dashboard";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const baseUrl = SITE_URL;

  if (error) {
    const desc = searchParams.get("error_description") ?? error;
    return NextResponse.redirect(
      new URL(`/dashboard?error=discord&message=${encodeURIComponent(desc)}`, baseUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=callback_missing", baseUrl)
    );
  }

  const stateConsumed = await consumeOAuthState(state);
  if (stateConsumed === null) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", baseUrl)
    );
  }

  try {
    const tokens = await exchangeCode(code);
    const [userInfo, guilds] = await Promise.all([
      getUserInfo(tokens.access_token),
      getUserGuilds(tokens.access_token).catch(() => []),
    ]);
    const picture = getAvatarUrl(userInfo);
    if (guilds.length > 0) {
      const client = await getDb();
      const dbName = await getDbName();
      const db = client.db(dbName);
      await db.collection(COLLECTIONS.userGuilds).updateOne(
        { userId: userInfo.id },
        { $set: { guilds, updatedAt: new Date() }, $setOnInsert: { userId: userInfo.id } },
        { upsert: true }
      );
    }

    const sessionValue = await createSession({
      sub: userInfo.id,
      name: userInfo.global_name ?? userInfo.username,
      preferred_username: userInfo.username,
      profile: `https://discord.com/users/${userInfo.id}`,
      picture,
      ...(userInfo.public_flags != null && { public_flags: userInfo.public_flags }),
      ...(userInfo.premium_type != null && userInfo.premium_type > 0 && { premium_type: userInfo.premium_type }),
    });
    const config = getSessionCookieConfig(sessionValue);
    const res = NextResponse.redirect(new URL(DASHBOARD_PATH, baseUrl));
    const { name, value, ...opts } = config;
    res.cookies.set(name, value, opts);
    return res;
  } catch (err) {
    console.error("Discord OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=token_exchange", SITE_URL)
    );
  }
}
