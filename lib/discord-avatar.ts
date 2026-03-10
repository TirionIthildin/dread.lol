/**
 * Resolve Discord avatar URL dynamically.
 * When profile.avatarUrl is "discord", we fetch the current avatar from Discord API
 * and cache it in Redis to avoid rate limits.
 */
import { getAvatarUrl, type DiscordUser } from "@/lib/auth/discord";
import { getValkey } from "@/lib/valkey";

const AVATAR_KEY_PREFIX = "discord:avatar:";
const AVATAR_TTL_SECONDS = 60 * 60; // 1 hour
const DISCORD_API = "https://discord.com/api/v10";

interface DiscordUserApiResponse {
  id: string;
  username?: string;
  discriminator?: string;
  avatar?: string | null;
  [key: string]: unknown;
}

/**
 * Fetch Discord user from API (avatar + discriminator for default avatar).
 */
async function fetchDiscordUserForAvatar(discordUserId: string): Promise<DiscordUser | null> {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) return null;
  const url = `${DISCORD_API}/users/${discordUserId}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${token}` },
    });
    const body = await res.text();
    if (!res.ok) return null;
    const parsed = body ? (JSON.parse(body) as DiscordUserApiResponse) : null;
    if (!parsed || typeof parsed.id !== "string") return null;
    return {
      id: parsed.id,
      username: parsed.username ?? "",
      global_name: (parsed as { global_name?: string | null }).global_name ?? null,
      avatar: typeof parsed.avatar === "string" ? parsed.avatar : parsed.avatar ?? null,
      discriminator: typeof parsed.discriminator === "string" ? parsed.discriminator : "0",
    };
  } catch {
    return null;
  }
}

/**
 * Resolve Discord avatar URL for a user. Checks Redis cache first, then Discord API.
 * Returns null if token missing, API fails, or user not found.
 */
export async function resolveDiscordAvatarUrl(
  discordUserId: string,
  size = 128
): Promise<string | null> {
  const cacheKey = `${AVATAR_KEY_PREFIX}${discordUserId}:${size}`;
  try {
    const redis = getValkey();
    const cached = await redis.get(cacheKey);
    if (cached) return cached;
  } catch {
    /* proceed to API */
  }

  const user = await fetchDiscordUserForAvatar(discordUserId);
  if (!user) return null;

  const url = getAvatarUrl(user, size);
  try {
    const redis = getValkey();
    await redis.setex(cacheKey, AVATAR_TTL_SECONDS, url);
  } catch {
    /* return URL anyway */
  }
  return url;
}
