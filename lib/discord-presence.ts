/**
 * Discord presence (status + Rich Presence) stored in Redis by the presence bot.
 * Keys: discord:presence:{discordUserId}, TTL 5 minutes (bot refreshes on PRESENCE_UPDATE).
 */
import { getValkey } from "@/lib/valkey";

const PRESENCE_KEY_PREFIX = "discord:presence:";
const PRESENCE_TTL_SECONDS = 300; // 5 minutes

export type DiscordPresenceStatus = "online" | "idle" | "dnd" | "offline";

export interface DiscordActivity {
  name: string;
  type?: number;
  state?: string | null;
  details?: string | null;
  /** Application ID for game art (e.g. large image URL). */
  applicationId?: string | null;
}

export interface DiscordPresence {
  status: DiscordPresenceStatus;
  activities: DiscordActivity[];
  /** Per-client status (desktop, mobile, web). */
  clientStatus?: { desktop?: string; mobile?: string; web?: string };
  /** When this was last updated (ISO string). */
  updatedAt?: string;
}

/**
 * Get cached presence for a Discord user ID. Returns null if not in cache.
 */
export async function getDiscordPresence(discordUserId: string): Promise<DiscordPresence | null> {
  const redis = getValkey();
  const raw = await redis.get(PRESENCE_KEY_PREFIX + discordUserId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DiscordPresence;
  } catch {
    return null;
  }
}

/**
 * Set presence in Redis (used by the presence bot). Public so the bot script can call it.
 */
export async function setDiscordPresence(discordUserId: string, presence: DiscordPresence): Promise<void> {
  const redis = getValkey();
  const value = JSON.stringify({
    ...presence,
    updatedAt: new Date().toISOString(),
  });
  await redis.setex(PRESENCE_KEY_PREFIX + discordUserId, PRESENCE_TTL_SECONDS, value);
}

/**
 * Delete presence (e.g. user went offline). Bot can call this on presence with status offline and no activities.
 */
export async function deleteDiscordPresence(discordUserId: string): Promise<void> {
  const redis = getValkey();
  await redis.del(PRESENCE_KEY_PREFIX + discordUserId);
}
