import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, getUserInfo } from "@/lib/auth/roblox";
import { redirectAuthToCanonicalOrigin } from "@/lib/auth/subdomain-canonical";
import { consumeOAuthState, getSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
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
      new URL(`${DASHBOARD_PATH}?error=roblox&message=${encodeURIComponent(desc)}`, baseUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${DASHBOARD_PATH}?error=callback_missing`, baseUrl)
    );
  }

  const _consumed = await consumeOAuthState(state, "roblox");
  if (_consumed === null) {
    return NextResponse.redirect(
      new URL(`${DASHBOARD_PATH}?error=invalid_state`, baseUrl)
    );
  }

  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.redirect(
      new URL(`${DASHBOARD_PATH}?error=login_required`, baseUrl)
    );
  }

  try {
    const tokens = await exchangeCode(code);
    const userInfo = await getUserInfo(tokens.access_token);

    const client = await getDb();
    const dbName = await getDbName();
    await client.db(dbName).collection(COLLECTIONS.userRoblox).updateOne(
      { userId: session.sub },
      {
        $set: {
          robloxUserId: userInfo.sub,
          robloxUsername: userInfo.preferred_username ?? userInfo.nickname ?? userInfo.name ?? "",
          robloxDisplayName: userInfo.name ?? userInfo.nickname ?? userInfo.preferred_username ?? "",
          robloxProfileUrl: userInfo.profile ?? `https://www.roblox.com/users/${userInfo.sub}/profile`,
          robloxAvatarUrl: userInfo.picture ?? null,
          robloxAccountCreatedAt: userInfo.created_at != null ? new Date(userInfo.created_at * 1000) : null,
          refreshToken: tokens.refresh_token ?? null,
          updatedAt: new Date(),
        },
        $setOnInsert: { userId: session.sub },
      },
      { upsert: true }
    );

    return NextResponse.redirect(
      new URL(`${DASHBOARD_PATH}/my-profile?roblox=linked`, baseUrl)
    );
  } catch (err) {
    logger.error("RobloxAuth", "OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`${DASHBOARD_PATH}?error=roblox_token&message=Failed+to+link`, baseUrl)
    );
  }
}
