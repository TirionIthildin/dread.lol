/**
 * Discord widget data for profile display.
 * Four widget types: account age, joined (Dread.lol), server count, server invite.
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import { getDiscordAccountCreatedAt, formatAccountAge } from "@/lib/discord-snowflake";

export type DiscordWidgetType = "accountAge" | "joined" | "serverCount" | "serverInvite";

export interface DiscordWidgetData {
  accountAge?: { createdAt: Date; label: string };
  joined?: { createdAt: Date; label: string };
  serverCount?: number;
  serverInvite?: { url: string; guildName?: string; memberCount?: number };
}

/**
 * Get widget data for a user's profile.
 * @param userId - Discord user ID (for account age, server count)
 * @param enabledWidgets - Which widgets to fetch
 * @param discordInviteUrl - User's own invite link (URL or code like "abc123") for the server invite widget
 * @param profileCreatedAt - Profile creation date for the "joined" widget (Dread.lol account age)
 */
export async function getDiscordWidgetData(
  userId: string,
  enabledWidgets: DiscordWidgetType[],
  discordInviteUrl?: string | null,
  profileCreatedAt?: Date | null
): Promise<DiscordWidgetData> {
  const data: DiscordWidgetData = {};
  const wantsAccountAge = enabledWidgets.includes("accountAge");
  const wantsJoined = enabledWidgets.includes("joined");
  const wantsServerCount = enabledWidgets.includes("serverCount");
  const wantsServerInvite = enabledWidgets.includes("serverInvite");

  if (wantsAccountAge) {
    const createdAt = getDiscordAccountCreatedAt(userId);
    if (createdAt) {
      data.accountAge = { createdAt, label: formatAccountAge(createdAt) };
    }
  }

  if (wantsJoined && profileCreatedAt) {
    data.joined = { createdAt: profileCreatedAt, label: formatAccountAge(profileCreatedAt) };
  }

  if (wantsServerCount) {
    const guilds = await getUserGuildCount(userId);
    if (guilds != null) data.serverCount = guilds;
  }

  if (wantsServerInvite && discordInviteUrl?.trim()) {
    const url = discordInviteUrl.trim();
    const resolved =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://discord.gg/${url.replace(/^\/+/, "")}`;
    if (resolved.startsWith("https://discord.gg/") || resolved.startsWith("https://discord.com/invite/")) {
      const code = extractInviteCode(resolved);
      const inviteInfo = code ? await fetchInviteInfo(code) : null;
      data.serverInvite = {
        url: resolved,
        guildName: inviteInfo?.guildName,
        memberCount: inviteInfo?.approximateMemberCount,
      };
    }
  }

  return data;
}

function extractInviteCode(urlOrCode: string): string | null {
  const trimmed = urlOrCode.trim().replace(/^\/+/, "");
  const match = trimmed.match(/(?:discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9-]+)/);
  return match ? match[1] : (trimmed.length > 0 && trimmed.length < 32 ? trimmed : null);
}

interface DiscordInviteResponse {
  guild?: { name?: string };
  approximate_member_count?: number;
}

async function fetchInviteInfo(code: string): Promise<{ guildName?: string; approximateMemberCount?: number } | null> {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) return null;
  try {
    const res = await fetch(
      `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`,
      {
        headers: { Authorization: `Bot ${token}` },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as DiscordInviteResponse;
    return {
      guildName: json.guild?.name,
      approximateMemberCount: json.approximate_member_count,
    };
  } catch {
    return null;
  }
}

async function getUserGuildCount(userId: string): Promise<number | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection(COLLECTIONS.userGuilds)
    .findOne({ userId }, { projection: { guilds: 1 } });
  const guilds = (doc as { guilds?: unknown[] } | null)?.guilds;
  return Array.isArray(guilds) ? guilds.length : null;
}

