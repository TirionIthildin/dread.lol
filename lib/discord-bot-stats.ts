/**
 * Valkey stats for the Discord presence bot (see scripts/discord-presence-bot.mjs).
 */
import { getValkey } from "@/lib/valkey";

export const DISCORD_BOT_HEARTBEAT_KEY = "discord:bot:heartbeat";

const HEARTBEAT_STALE_MS = 3 * 60 * 1000; // 3 minutes — bot writes every 60s with 120s TTL

async function countKeysMatching(pattern: string): Promise<number> {
  const redis = getValkey();
  let cursor = "0";
  let total = 0;
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 500);
    cursor = next;
    total += keys.length;
  } while (cursor !== "0");
  return total;
}

export type DiscordBotHealthStatus = "healthy" | "degraded" | "unhealthy";

export interface DiscordBotStats {
  valkeyReachable: boolean;
  valkeyError?: string;
  presenceKeysCount: number;
  lastSeenKeysCount: number;
  flagsKeysCount: number;
  heartbeatRaw: string | null;
  heartbeatAt: number | null;
  heartbeatAgeMs: number | null;
  heartbeatPid: number | null;
  health: DiscordBotHealthStatus;
}

export async function getDiscordBotStats(): Promise<DiscordBotStats> {
  let valkeyReachable = false;
  let valkeyError: string | undefined;
  let presenceKeysCount = 0;
  let lastSeenKeysCount = 0;
  let flagsKeysCount = 0;
  let heartbeatRaw: string | null = null;
  let heartbeatAt: number | null = null;
  let heartbeatAgeMs: number | null = null;
  let heartbeatPid: number | null = null;

  try {
    const redis = getValkey();
    await redis.ping();
    valkeyReachable = true;

    const [presence, lastSeen, flags, hb] = await Promise.all([
      countKeysMatching("discord:presence:*"),
      countKeysMatching("discord:lastseen:*"),
      countKeysMatching("discord:flags:*"),
      redis.get(DISCORD_BOT_HEARTBEAT_KEY).catch(() => null),
    ]);

    presenceKeysCount = presence;
    lastSeenKeysCount = lastSeen;
    flagsKeysCount = flags;
    heartbeatRaw = hb;

    if (hb) {
      try {
        const parsed = JSON.parse(hb) as { at?: number; pid?: number };
        if (typeof parsed.at === "number") {
          heartbeatAt = parsed.at;
          heartbeatAgeMs = Date.now() - parsed.at;
        }
        if (typeof parsed.pid === "number") {
          heartbeatPid = parsed.pid;
        }
      } catch {
        const n = Number.parseInt(hb, 10);
        if (!Number.isNaN(n)) {
          heartbeatAt = n;
          heartbeatAgeMs = Date.now() - n;
        }
      }
    }
  } catch (e) {
    valkeyError = e instanceof Error ? e.message : String(e);
  }

  let health: DiscordBotHealthStatus = "unhealthy";
  if (!valkeyReachable) {
    health = "unhealthy";
  } else if (heartbeatAgeMs != null && heartbeatAgeMs >= 0 && heartbeatAgeMs <= HEARTBEAT_STALE_MS) {
    health = "healthy";
  } else {
    health = "degraded";
  }

  return {
    valkeyReachable,
    valkeyError,
    presenceKeysCount,
    lastSeenKeysCount,
    flagsKeysCount,
    heartbeatRaw,
    heartbeatAt,
    heartbeatAgeMs,
    heartbeatPid,
    health,
  };
}
