/**
 * Discord public_flags (badge bitfield) cache in Redis.
 * Bot writes here; app reads and optionally persists to users.discord_public_flags.
 * Fallback: fetch from Discord API when Redis/DB are empty.
 *
 * Debug: set DEBUG_DISCORD_FLAGS=1 to log lookup/fetch details.
 */
import { getValkey } from "@/lib/valkey";

const FLAGS_KEY_PREFIX = "discord:flags:";
const PREMIUM_KEY_PREFIX = "discord:premium:";
const FLAGS_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const DISCORD_API = "https://discord.com/api/v10";

function debug(...args: unknown[]) {
  const enabled =
    process.env.DEBUG_DISCORD_FLAGS === "1" ||
    (process.env.NODE_ENV === "development" && process.env.DEBUG_DISCORD_FLAGS !== "0");
  if (enabled) {
    console.log("[DiscordFlags]", ...args);
  }
}

/**
 * Get cached public_flags for a Discord user. Returns null if not in Redis.
 */
export async function getDiscordFlagsFromRedis(discordUserId: string): Promise<number | null> {
  try {
    const redis = getValkey();
    const key = FLAGS_KEY_PREFIX + discordUserId;
    const raw = await redis.get(key);
    if (raw === null) {
      debug("Redis miss", { userId: discordUserId, key });
      return null;
    }
    const n = Number.parseInt(raw, 10);
    const result = Number.isNaN(n) ? null : n;
    debug("Redis hit", { userId: discordUserId, raw, parsed: result });
    return result;
  } catch (err) {
    debug("Redis error", { userId: discordUserId, err: err instanceof Error ? err.message : err });
    return null;
  }
}

/**
 * Set public_flags in Redis (used by the presence bot). TTL 24h.
 */
export async function setDiscordFlagsInRedis(discordUserId: string, publicFlags: number): Promise<void> {
  const redis = getValkey();
  await redis.setex(FLAGS_KEY_PREFIX + discordUserId, FLAGS_TTL_SECONDS, String(publicFlags));
}

export async function getDiscordPremiumFromRedis(discordUserId: string): Promise<number | null> {
  try {
    const redis = getValkey();
    const raw = await redis.get(PREMIUM_KEY_PREFIX + discordUserId);
    if (raw === null) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

export async function setDiscordPremiumInRedis(discordUserId: string, premiumType: number): Promise<void> {
  const redis = getValkey();
  await redis.setex(PREMIUM_KEY_PREFIX + discordUserId, FLAGS_TTL_SECONDS, String(premiumType));
}

interface DiscordUserApiResponse {
  id?: string;
  public_flags?: number;
  premium_type?: number;
  message?: string;
  code?: number;
}

/**
 * Fetch user from Discord API (public_flags + premium_type). Returns both or null.
 */
export async function fetchDiscordUserFromApi(
  discordUserId: string
): Promise<{ publicFlags: number; premiumType: number } | null> {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) {
    debug("API skip: DISCORD_BOT_TOKEN not set");
    return null;
  }
  const url = `${DISCORD_API}/users/${discordUserId}`;
  debug("API fetch", { userId: discordUserId, url });
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${token}` },
    });
    const body = await res.text();
    let parsed: DiscordUserApiResponse | null = null;
    try {
      parsed = body ? (JSON.parse(body) as DiscordUserApiResponse) : null;
    } catch {
      /* ignore */
    }
    if (!res.ok) {
      debug("API error", {
        userId: discordUserId,
        status: res.status,
        statusText: res.statusText,
        body: body.slice(0, 200),
        parsed,
      });
      return null;
    }
    if (parsed && "id" in parsed) {
      const flags = typeof parsed.public_flags === "number" ? parsed.public_flags : 0;
      const premium = typeof parsed.premium_type === "number" ? parsed.premium_type : 0;
      debug("API success", { userId: discordUserId, public_flags: flags, premium_type: premium });
      return { publicFlags: flags, premiumType: premium };
    }
    debug("API response unexpected", {
      userId: discordUserId,
      keys: parsed ? Object.keys(parsed) : [],
      body: body.slice(0, 200),
    });
    return null;
  } catch (err) {
    debug("API exception", {
      userId: discordUserId,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/** @deprecated Use fetchDiscordUserFromApi. Kept for backward compat. */
export async function fetchDiscordFlagsFromApi(discordUserId: string): Promise<number | null> {
  const data = await fetchDiscordUserFromApi(discordUserId);
  return data?.publicFlags ?? null;
}

export { FLAGS_KEY_PREFIX, FLAGS_TTL_SECONDS };
