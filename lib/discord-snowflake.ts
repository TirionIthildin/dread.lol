/**
 * Discord snowflake utilities.
 * Snowflake IDs encode creation timestamp: (id >> 22) + DISCORD_EPOCH_MS
 * @see https://discord.com/developers/docs/reference#snowflakes
 */
const DISCORD_EPOCH_MS = 1_420_070_400_000; // Jan 1, 2015 00:00:00 UTC

/**
 * Extract creation timestamp (ms) from a Discord snowflake.
 * Returns null if the ID is invalid.
 */
export function snowflakeToTimestamp(snowflake: string): number | null {
  const id = BigInt(snowflake);
  if (id < BigInt(0)) return null;
  const ms = Number(id >> BigInt(22)) + DISCORD_EPOCH_MS;
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Get account creation date from Discord user ID.
 */
export function getDiscordAccountCreatedAt(userId: string): Date | null {
  const ms = snowflakeToTimestamp(userId);
  return ms != null ? new Date(ms) : null;
}

/**
 * Format account age for display (e.g. "3 years", "6 months", "2 weeks").
 */
export function formatAccountAge(createdAt: Date): string {
  const now = new Date();
  const ms = now.getTime() - createdAt.getTime();
  const years = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor((ms % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
  if (years > 0) return `${years} year${years !== 1 ? "s" : ""}`;
  if (months > 0) return `${months} month${months !== 1 ? "s" : ""}`;
  const weeks = Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
  if (weeks > 0) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  return `${days} day${days !== 1 ? "s" : ""}`;
}
