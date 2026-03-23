import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, getUserInfo, getAvatarUrl, getUserGuilds } from "@/lib/auth/discord";
import { redirectAuthToCanonicalOrigin } from "@/lib/auth/subdomain-canonical";
import { logger } from "@/lib/logger";
import { findUserById } from "@/lib/auth/local-account";
import {
  getMfaPendingCookieConfig,
  setMfaPending,
} from "@/lib/auth/mfa-pending";
import {
  consumeOAuthState,
  createSession,
  getSessionCookieConfig,
} from "@/lib/auth/session";
import { getClientIp } from "@/lib/rate-limit";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

const DASHBOARD_PATH = "/dashboard";

export async function GET(request: NextRequest) {
  const subdomainRedirect = redirectAuthToCanonicalOrigin(request);
  if (subdomainRedirect) return subdomainRedirect;

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

    const pendingSession = {
      sub: userInfo.id,
      auth_provider: "discord" as const,
      name: userInfo.global_name ?? userInfo.username,
      preferred_username: userInfo.username,
      profile: `https://discord.com/users/${userInfo.id}`,
      picture,
      ...(userInfo.public_flags != null && { public_flags: userInfo.public_flags }),
      ...(userInfo.premium_type != null && userInfo.premium_type > 0 && { premium_type: userInfo.premium_type }),
    };

    const existingUser = await findUserById(userInfo.id);
    if (existingUser?.totpEnabled) {
      const mfaToken = await setMfaPending(pendingSession);
      const res = NextResponse.redirect(new URL("/mfa", baseUrl));
      const mfaCfg = getMfaPendingCookieConfig(mfaToken);
      const { name: mfaCookieName, value: mfaCookieValue, ...mfaCookieOpts } = mfaCfg;
      res.cookies.set(mfaCookieName, mfaCookieValue, mfaCookieOpts);
      return res;
    }

    const sessionValue = await createSession(pendingSession, {
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    const config = getSessionCookieConfig(sessionValue);
    const res = NextResponse.redirect(new URL(DASHBOARD_PATH, baseUrl));
    const { name, value, ...opts } = config;
    res.cookies.set(name, value, opts);
    return res;
  } catch (err) {
    logger.error("DiscordAuth", "OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=token_exchange", SITE_URL)
    );
  }
}
