/**
 * Last seen timestamp for Discord users. Updated by presence bot on each presence update.
 * TTL 7 days.
 */
import { getValkey } from "@/lib/valkey";

const KEY_PREFIX = "discord:lastseen:";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function getDiscordLastSeen(userId: string): Promise<Date | null> {
  const redis = getValkey();
  const raw = await redis.get(KEY_PREFIX + userId);
  if (!raw) return null;
  const ts = Number.parseInt(raw, 10);
  if (Number.isNaN(ts)) return null;
  return new Date(ts);
}

export async function setDiscordLastSeen(userId: string, at?: Date): Promise<void> {
  const redis = getValkey();
  const ts = (at ?? new Date()).getTime();
  await redis.setex(KEY_PREFIX + userId, TTL_SECONDS, String(ts));
}

export function formatLastSeen(at: Date): string {
  const now = Date.now();
  const diffMs = now - at.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return at.toLocaleDateString();
}
