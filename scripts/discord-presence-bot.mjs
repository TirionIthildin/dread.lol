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
 *       DISCORD_BOT_ACTIVITY — optional status line (default: "dread.lol").
 * Run: npm run discord-presence-bot
 */
import { ActivityType, Client, GatewayIntentBits } from "discord.js";
import Redis from "ioredis";

const PRESENCE_KEY_PREFIX = "discord:presence:";
/** Longer than sweep interval so keys don't expire between sweeps if Discord sends no presenceUpdate (stable online state). */
const PRESENCE_TTL_SECONDS = 600; // 10 min
const FLAGS_KEY_PREFIX = "discord:flags:";
const PREMIUM_KEY_PREFIX = "discord:premium:";
const LASTSEEN_KEY_PREFIX = "discord:lastseen:";
const FLAGS_TTL_SECONDS = 60 * 60 * 24; // 24 h
const LASTSEEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const PRESENCE_SWEEP_INTERVAL_MS = 5 * 60 * 1000; // presenceUpdate only fires on *changes*; sweep refreshes Redis presence + lastSeen for users still online
const HEARTBEAT_KEY = "discord:bot:heartbeat";
const HEARTBEAT_TTL_SECONDS = 120;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const DISCORD_API_ORIGIN = "https://discord.com";

/** @param {string} discordUserId */
function getDiscordApiUserUrlObject(discordUserId) {
  if (!/^\d{17,20}$/.test(discordUserId)) return null;
  const u = new URL(`/api/v10/users/${discordUserId}`, DISCORD_API_ORIGIN);
  if (u.origin !== DISCORD_API_ORIGIN) return null;
  return u;
}

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

function writeHeartbeat() {
  const payload = JSON.stringify({
    at: Date.now(),
    pid: process.pid,
  });
  redis.setex(HEARTBEAT_KEY, HEARTBEAT_TTL_SECONDS, payload).catch((err) => {
    console.error("[Redis] heartbeat", err?.message ?? err);
  });
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
    const userUrl = getDiscordApiUserUrlObject(userId);
    if (!userUrl) return;
    const res = await fetch(userUrl, {
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

/**
 * Refresh discord:presence and lastSeen for users currently online/idle/dnd.
 * presenceUpdate only fires when something *changes*; without this, the presence key TTL expires
 * while the user stays online and the site shows offline + a confusing last-seen line.
 */
function sweepPresenceForOnlineUsers() {
  const guildsToCheck = guildId
    ? [client.guilds.cache.get(guildId)].filter(Boolean)
    : [...client.guilds.cache.values()];
  const now = String(Date.now());
  let count = 0;
  for (const guild of guildsToCheck) {
    const presences = guild.presences?.cache;
    if (!presences) continue;
    for (const presence of presences.values()) {
      if (presence.status && presence.status !== "offline") {
        const uid = presence.userId ?? presence.user?.id;
        if (uid) {
          const presenceKey = PRESENCE_KEY_PREFIX + uid;
          const value = serializePresence(presence);
          redis.setex(presenceKey, PRESENCE_TTL_SECONDS, value).catch((err) => {
            console.error("[Redis] presence sweep", uid, err?.message ?? err);
          });
          const lastSeenKey = LASTSEEN_KEY_PREFIX + uid;
          redis.setex(lastSeenKey, LASTSEEN_TTL_SECONDS, now).catch((err) => {
            console.error("[Redis] lastseen sweep", uid, err?.message ?? err);
          });
          count += 1;
        }
      }
    }
  }
  if (count > 0) {
    console.log(`[Discord] Sweep: refreshed presence + lastSeen for ${count} online user(s)`);
  }
}

client.on("clientReady", async () => {
  console.log(`[Discord] Logged in as ${client.user?.tag ?? "?"}`);
  // Explicit online + activity so the bot doesn’t sit “invisible” in the member list (gateway alone may not show green).
  const activityName = process.env.DISCORD_BOT_ACTIVITY?.trim() || "dread.lol";
  try {
    await client.user?.setPresence({
      status: "online",
      activities: [{ name: activityName, type: ActivityType.Watching }],
    });
  } catch (err) {
    console.error("[Discord] setPresence failed:", err?.message ?? err);
  }
  if (guildId) {
    const guild = client.guilds.cache.get(guildId);
    console.log(`[Discord] Watching guild: ${guild?.name ?? guildId}`);
  } else {
    console.log("[Discord] Watching all guilds (set DISCORD_GUILD_ID to limit)");
  }
  writeHeartbeat();
  setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);
  // Initial sweep after a short delay (let presence cache populate)
  setTimeout(sweepPresenceForOnlineUsers, 30_000);
  setInterval(sweepPresenceForOnlineUsers, PRESENCE_SWEEP_INTERVAL_MS);
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
