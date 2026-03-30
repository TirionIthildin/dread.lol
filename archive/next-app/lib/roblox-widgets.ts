/**
 * Roblox widget data for profile display.
 * Requires user to have linked Roblox via OAuth (user_roblox collection).
 */
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";

/** Fetch Roblox avatar headshot URL from thumbnails API (public, no auth required). */
export async function fetchRobloxAvatarUrl(robloxUserId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${encodeURIComponent(robloxUserId)}&size=100x100&format=Png&isCircular=true`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: Array<{ imageUrl?: string }> };
    const first = data.data?.[0];
    return first?.imageUrl?.trim() ?? null;
  } catch {
    return null;
  }
}

/** Check if a user has linked their Roblox account. */
export async function hasRobloxLinked(userId: string): Promise<boolean> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection(COLLECTIONS.userRoblox)
    .findOne({ userId }, { projection: { _id: 1 } });
  return doc != null;
}

export type RobloxWidgetType = "accountAge" | "profile";

export interface RobloxWidgetData {
  accountAge?: { createdAt: Date; label: string; avatarUrl?: string | null };
  profile?: { url: string; displayName: string; username: string; avatarUrl?: string | null };
}

function formatAccountAge(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  if (years >= 1) return `${years} year${years !== 1 ? "s" : ""}`;
  const months = Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000));
  if (months >= 1) return `${months} month${months !== 1 ? "s" : ""}`;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days} day${days !== 1 ? "s" : ""}`;
  return "New";
}

/**
 * Get Roblox widget data for a user's profile.
 * @param userId - Dread user ID (Discord ID) – must have linked Roblox via OAuth
 * @param enabledWidgets - Which widgets to fetch
 */
export async function getRobloxWidgetData(
  userId: string,
  enabledWidgets: RobloxWidgetType[]
): Promise<RobloxWidgetData | null> {
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection(COLLECTIONS.userRoblox)
    .findOne(
      { userId },
      {
        projection: {
          robloxUserId: 1,
          robloxUsername: 1,
          robloxDisplayName: 1,
          robloxProfileUrl: 1,
          robloxAccountCreatedAt: 1,
        },
      }
    );

  if (!doc) return null;

  const row = doc as {
    robloxUserId?: string;
    robloxUsername?: string;
    robloxDisplayName?: string;
    robloxProfileUrl?: string;
    robloxAccountCreatedAt?: Date | null;
  };

  const data: RobloxWidgetData = {};
  const needsAvatar = enabledWidgets.includes("accountAge") || enabledWidgets.includes("profile");
  const avatarUrl =
    needsAvatar && row.robloxUserId
      ? await fetchRobloxAvatarUrl(row.robloxUserId)
      : null;

  if (enabledWidgets.includes("accountAge") && row.robloxAccountCreatedAt) {
    data.accountAge = {
      createdAt: row.robloxAccountCreatedAt,
      label: formatAccountAge(row.robloxAccountCreatedAt) + " on Roblox",
      avatarUrl: avatarUrl ?? null,
    };
  }

  if (enabledWidgets.includes("profile") && row.robloxProfileUrl) {
    data.profile = {
      url: row.robloxProfileUrl,
      displayName: row.robloxDisplayName ?? row.robloxUsername ?? "Roblox",
      username: row.robloxUsername ?? "",
      avatarUrl: avatarUrl ?? null,
    };
  }

  if (Object.keys(data).length === 0) return null;
  return data;
}
