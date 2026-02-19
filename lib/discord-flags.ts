/**
 * Discord public_flags (badge bitfield) cache in Redis.
 * Bot writes here; app reads and optionally persists to users.discord_public_flags.
 */
import { getValkey } from "@/lib/valkey";

const FLAGS_KEY_PREFIX = "discord:flags:";
const FLAGS_TTL_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Get cached public_flags for a Discord user. Returns null if not in Redis.
 */
export async function getDiscordFlagsFromRedis(discordUserId: string): Promise<number | null> {
  const redis = getValkey();
  const raw = await redis.get(FLAGS_KEY_PREFIX + discordUserId);
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Set public_flags in Redis (used by the presence bot). TTL 24h.
 */
export async function setDiscordFlagsInRedis(discordUserId: string, publicFlags: number): Promise<void> {
  const redis = getValkey();
  await redis.setex(FLAGS_KEY_PREFIX + discordUserId, FLAGS_TTL_SECONDS, String(publicFlags));
}

export { FLAGS_KEY_PREFIX, FLAGS_TTL_SECONDS };
