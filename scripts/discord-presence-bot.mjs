#!/usr/bin/env node
/**
 * Discord presence bot: connects to the Gateway with GUILD_PRESENCES,
 * writes status + activities to Redis for use by the app.
 *
 * Prerequisites:
 * - Discord app with a Bot; enable "Privileged Gateway Intents" → PRESENCE INTENT.
 * - Bot must be in a server (guild) that your users join; set DISCORD_GUILD_ID to only sync that guild (optional).
 *
 * Env: DISCORD_BOT_TOKEN, VALKEY_URL (default redis://localhost:6379), DISCORD_GUILD_ID (optional).
 * Run: npm run discord-presence-bot
 */
import { Client, GatewayIntentBits } from "discord.js";
import Redis from "ioredis";

const PRESENCE_KEY_PREFIX = "discord:presence:";
const PRESENCE_TTL_SECONDS = 300; // 5 min
const FLAGS_KEY_PREFIX = "discord:flags:";
const PREMIUM_KEY_PREFIX = "discord:premium:";
const LASTSEEN_KEY_PREFIX = "discord:lastseen:";
const FLAGS_TTL_SECONDS = 60 * 60 * 24; // 24 h
const LASTSEEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DISCORD_API = "https://discord.com/api/v10";

const token = process.env.DISCORD_BOT_TOKEN?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim() || null;
const redisUrl = process.env.VALKEY_URL || "redis://localhost:6379";

if (!token) {
  console.warn("[Discord presence bot] DISCORD_BOT_TOKEN not set; skipping.");
  process.exit(0);
}

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 500, 3000);
  },
});

redis.on("error", (err) => console.error("[Redis]", err.message));
redis.on("connect", () => console.log("[Redis] Connected"));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
  ],
});

function mapActivity(a) {
  return {
    name: a.name ?? "Unknown",
    type: a.type,
    state: a.state ?? null,
    details: a.details ?? null,
    applicationId: a.applicationId ?? null,
  };
}

function serializePresence(presence) {
  const status = presence.status ?? "offline";
  const activities = (presence.activities ?? []).map(mapActivity);
  const clientStatus = presence.clientStatus
    ? {
        desktop: presence.clientStatus.desktop ?? undefined,
        mobile: presence.clientStatus.mobile ?? undefined,
        web: presence.clientStatus.web ?? undefined,
      }
    : undefined;
  return JSON.stringify({
    status,
    activities,
    clientStatus,
    updatedAt: new Date().toISOString(),
  });
}

async function fetchAndStoreUserFlags(userId) {
  const flagsKey = FLAGS_KEY_PREFIX + userId;
  const premiumKey = PREMIUM_KEY_PREFIX + userId;
  const existing = await redis.get(flagsKey).catch(() => null);
  if (existing !== null) return;
  try {
    const res = await fetch(`${DISCORD_API}/users/${userId}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) {
      if (res.status === 429) console.warn("[Discord] Rate limited fetching user", userId);
      return;
    }
    const user = await res.json();
    const flags = user.public_flags;
    if (typeof flags === "number") {
      await redis.setex(flagsKey, FLAGS_TTL_SECONDS, String(flags));
    }
    const premium = user.premium_type ?? user.premiumType;
    if (typeof premium === "number" && premium > 0) {
      await redis.setex(premiumKey, FLAGS_TTL_SECONDS, String(premium));
    }
  } catch (err) {
    console.error("[Discord] Fetch user flags", userId, err?.message ?? err);
  }
}

client.on("presenceUpdate", (oldPresence, newPresence) => {
  const guildIdMatch = !guildId || newPresence.guild?.id === guildId;
  if (!guildIdMatch) return;

  const userId = newPresence.userId ?? newPresence.user?.id;
  if (!userId) return;

  const key = PRESENCE_KEY_PREFIX + userId;
  const value = serializePresence(newPresence);

  redis
    .setex(key, PRESENCE_TTL_SECONDS, value)
    .catch((err) => console.error("[Redis] setex", userId, err.message));

  const lastSeenKey = LASTSEEN_KEY_PREFIX + userId;
  redis
    .setex(lastSeenKey, LASTSEEN_TTL_SECONDS, String(Date.now()))
    .catch((err) => console.error("[Redis] lastseen", userId, err.message));

  fetchAndStoreUserFlags(userId).catch(() => {});
});

client.on("clientReady", () => {
  console.log(`[Discord] Logged in as ${client.user?.tag ?? "?"}`);
  if (guildId) {
    const guild = client.guilds.cache.get(guildId);
    console.log(`[Discord] Watching guild: ${guild?.name ?? guildId}`);
  } else {
    console.log("[Discord] Watching all guilds (set DISCORD_GUILD_ID to limit)");
  }
});

client.on("error", (err) => console.error("[Discord]", err.message));

client.login(token).catch((err) => {
  console.error("Login failed:", err.message);
  process.exit(1);
});

// Graceful shutdown
async function shutdown() {
  client.destroy();
  redis.quit();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
