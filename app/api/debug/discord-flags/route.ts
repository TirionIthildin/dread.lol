/**
 * Admin-only debug endpoint for Discord badge flags.
 * GET /api/debug/discord-flags?userId={discordUserId}&slug={profileSlug}
 *
 * Returns detailed lookup trace: Redis, DB, API, and final result.
 * Use slug to also fetch profile's showDiscordBadges and decoded badges.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import {
  getDiscordFlagsFromRedis,
  getDiscordPremiumFromRedis,
  fetchDiscordUserFromApi,
  getDiscordApiUserUrl,
  setDiscordFlagsInRedis,
  setDiscordPremiumInRedis,
} from "@/lib/discord-flags";
import { decodeDiscordPublicFlags, getPremiumBadgeKeys } from "@/lib/discord-badges";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/db";

export async function GET(request: Request) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim();
  const slug = searchParams.get("slug")?.trim();
  const refresh = searchParams.get("refresh") === "1";

  if (!userId && !slug) {
    return NextResponse.json(
      { error: "Provide userId (Discord ID) or slug to look up" },
      { status: 400 }
    );
  }

  const client = await getDb();
  const dbName = await getDbName();
  let discordUserId = userId;

  if (!discordUserId && slug) {
    const profile = await client
      .db(dbName)
      .collection(COLLECTIONS.profiles)
      .findOne({ slug }, { projection: { userId: 1, showDiscordBadges: 1 } });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found", slug }, { status: 404 });
    }
    discordUserId = (profile as unknown as { userId: string }).userId;
  }

  if (!discordUserId) {
    return NextResponse.json({ error: "Could not resolve userId" }, { status: 400 });
  }

  if (!/^\d{17,20}$/.test(discordUserId)) {
    return NextResponse.json({ error: "Invalid Discord user id" }, { status: 400 });
  }

  const trace: Record<string, unknown> = { userId: discordUserId };

  const flagsRedis = await getDiscordFlagsFromRedis(discordUserId);
  const premiumRedis = await getDiscordPremiumFromRedis(discordUserId);
  trace.redis = { flags: flagsRedis, premium: premiumRedis };

  const userRow = await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne(
      { _id: discordUserId },
      { projection: { discordPublicFlags: 1, discordPremiumType: 1 } }
    );
  const flagsDb = userRow?.discordPublicFlags ?? null;
  const premiumDb = userRow?.discordPremiumType ?? null;
  trace.db = { flags: flagsDb, premium: premiumDb };

  const hasToken = Boolean(process.env.DISCORD_BOT_TOKEN?.trim());
  const apiTrace: Record<string, unknown> = { tokenSet: hasToken };
  const finalFlags = flagsRedis ?? flagsDb;
  const finalPremium = premiumRedis ?? premiumDb;
  if (!hasToken) {
    apiTrace.note = "DISCORD_BOT_TOKEN not set, skipping API fetch";
  } else {
    try {
      const apiUrl = getDiscordApiUserUrl(discordUserId);
      if (!apiUrl) {
        apiTrace.error = "Invalid Discord user id for API URL";
      } else {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN!}` },
      });
      const body = await res.text();
      let parsed: { public_flags?: number; premium_type?: number; id?: string; message?: string } | null = null;
      try {
        parsed = body ? JSON.parse(body) : null;
      } catch {
        /* ignore */
      }
      apiTrace.response = {
        status: res.status,
        statusText: res.statusText,
        body: body.slice(0, 300),
        public_flags: parsed?.public_flags,
        premium_type: parsed?.premium_type,
        hasId: parsed && "id" in parsed,
      };
      }
    } catch (apiErr) {
      apiTrace.error = apiErr instanceof Error ? apiErr.message : String(apiErr);
    }
  }
  trace.api = apiTrace;

  const allBadges = [
    ...(finalFlags != null ? decodeDiscordPublicFlags(finalFlags) : []),
    ...getPremiumBadgeKeys(finalPremium),
  ];
  trace.result = {
    flags: finalFlags,
    premium: finalPremium,
    badges: allBadges,
  };

  if (slug) {
    const profile = await client
      .db(dbName)
      .collection(COLLECTIONS.profiles)
      .findOne({ slug }, { projection: { userId: 1, showDiscordBadges: 1 } });
    trace.profile = profile
      ? {
          slug,
          userId: (profile as unknown as { userId: string }).userId,
          showDiscordBadges: (profile as unknown as { showDiscordBadges?: boolean }).showDiscordBadges,
          wouldShowBadges:
            (profile as unknown as { showDiscordBadges?: boolean }).showDiscordBadges !== false && allBadges.length > 0,
        }
      : null;
  }

  if (refresh && hasToken) {
    const fromApi = await fetchDiscordUserFromApi(discordUserId);
    const refreshTrace: Record<string, unknown> = { apiResult: fromApi };
    if (fromApi) {
      await setDiscordFlagsInRedis(discordUserId, fromApi.publicFlags);
      if (fromApi.premiumType > 0) {
        await setDiscordPremiumInRedis(discordUserId, fromApi.premiumType);
      }
      await client
        .db(dbName)
        .collection<UserDoc>(COLLECTIONS.users)
        .updateOne(
          { _id: discordUserId },
          {
            $set: {
              discordPublicFlags: fromApi.publicFlags,
              ...(fromApi.premiumType > 0 && { discordPremiumType: fromApi.premiumType }),
              updatedAt: new Date(),
            },
          }
        );
      refreshTrace.persisted = true;
      const refreshedBadges = [
        ...decodeDiscordPublicFlags(fromApi.publicFlags),
        ...getPremiumBadgeKeys(fromApi.premiumType),
      ];
      trace.result = {
        flags: fromApi.publicFlags,
        premium: fromApi.premiumType,
        badges: refreshedBadges,
      };
    }
    trace.refresh = refreshTrace;
  }

  return NextResponse.json(trace);
}
