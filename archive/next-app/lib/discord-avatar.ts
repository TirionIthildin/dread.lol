/**
 * Resolve Discord avatar and avatar-decoration URLs dynamically.
 * When profile.avatarUrl is "discord", we fetch from Discord API and cache in Valkey.
 */
import { getAvatarDecorationUrl, getAvatarUrl, type DiscordUser } from "@/lib/auth/discord";
import { getDiscordApiUserUrlObject } from "@/lib/discord-flags";
import { getValkey } from "@/lib/valkey";

const USER_MEDIA_CACHE_PREFIX = "discord:user-media:v2:";
const LEGACY_AVATAR_KEY_PREFIX = "discord:avatar:";
const AVATAR_TTL_SECONDS = 60 * 60; // 1 hour

interface DiscordUserApiResponse {
  id: string;
  username?: string;
  discriminator?: string;
  avatar?: string | null;
  global_name?: string | null;
  avatar_decoration_data?: { asset?: string; sku_id?: string } | null;
  [key: string]: unknown;
}

export interface DiscordUserMedia {
  avatarUrl: string;
  /** CDN URL or null if user has no decoration. */
  decorationUrl: string | null;
}

interface CachedUserMediaPayload {
  avatarUrl: string;
  decorationUrl: string | null;
}

/**
 * Fetch Discord user (avatar + optional avatar_decoration_data) via bot token.
 */
async function fetchDiscordUserForMedia(discordUserId: string): Promise<{
  user: DiscordUser;
  decorationAsset: string | null;
} | null> {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) return null;
  const userUrl = getDiscordApiUserUrlObject(discordUserId);
  if (!userUrl) return null;
  try {
    const res = await fetch(userUrl, {
      headers: { Authorization: `Bot ${token}` },
    });
    const body = await res.text();
    if (!res.ok) return null;
    const parsed = body ? (JSON.parse(body) as DiscordUserApiResponse) : null;
    if (!parsed || typeof parsed.id !== "string") return null;
    const deco = parsed.avatar_decoration_data;
    const decorationAsset =
      deco && typeof deco === "object" && typeof deco.asset === "string" && deco.asset.trim()
        ? deco.asset.trim()
        : null;
    return {
      user: {
        id: parsed.id,
        username: parsed.username ?? "",
        global_name: parsed.global_name ?? null,
        avatar: typeof parsed.avatar === "string" ? parsed.avatar : parsed.avatar ?? null,
        discriminator: typeof parsed.discriminator === "string" ? parsed.discriminator : "0",
      },
      decorationAsset,
    };
  } catch {
    return null;
  }
}

function buildUserMedia(user: DiscordUser, decorationAsset: string | null, size: number): DiscordUserMedia {
  const avatarUrl = getAvatarUrl(user, size);
  const decorationUrl = decorationAsset ? getAvatarDecorationUrl(decorationAsset) : null;
  return { avatarUrl, decorationUrl };
}

/**
 * Resolve Discord avatar URL + optional avatar decoration URL. Redis cache first, then API (one round-trip).
 */
export async function resolveDiscordUserMedia(
  discordUserId: string,
  size = 128
): Promise<DiscordUserMedia | null> {
  const cacheKey = `${USER_MEDIA_CACHE_PREFIX}${discordUserId}:${size}`;
  try {
    const redis = getValkey();
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CachedUserMediaPayload;
        if (parsed && typeof parsed.avatarUrl === "string") {
          return {
            avatarUrl: parsed.avatarUrl,
            decorationUrl: typeof parsed.decorationUrl === "string" ? parsed.decorationUrl : null,
          };
        }
      } catch {
        /* fall through */
      }
    }
  } catch {
    /* proceed to API */
  }

  const fetched = await fetchDiscordUserForMedia(discordUserId);
  if (!fetched) {
    return tryLegacyAvatarCache(discordUserId, size);
  }

  const media = buildUserMedia(fetched.user, fetched.decorationAsset, size);
  try {
    const redis = getValkey();
    const payload: CachedUserMediaPayload = {
      avatarUrl: media.avatarUrl,
      decorationUrl: media.decorationUrl,
    };
    await redis.setex(cacheKey, AVATAR_TTL_SECONDS, JSON.stringify(payload));
  } catch {
    /* return media anyway */
  }
  return media;
}

/** Fallback when API fails but legacy single-URL cache still has the avatar string. */
async function tryLegacyAvatarCache(
  discordUserId: string,
  size: number
): Promise<DiscordUserMedia | null> {
  const legacyKey = `${LEGACY_AVATAR_KEY_PREFIX}${discordUserId}:${size}`;
  try {
    const redis = getValkey();
    const cached = await redis.get(legacyKey);
    if (cached) return { avatarUrl: cached, decorationUrl: null };
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Resolve Discord avatar URL for a user. Checks Redis cache first, then Discord API.
 * Returns null if token missing, API fails, or user not found.
 */
export async function resolveDiscordAvatarUrl(
  discordUserId: string,
  size = 128
): Promise<string | null> {
  const media = await resolveDiscordUserMedia(discordUserId, size);
  return media?.avatarUrl ?? null;
}
