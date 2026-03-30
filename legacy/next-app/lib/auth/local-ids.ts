const LOCAL_PREFIX = "local:";

/** New Mongo user id for local (non-Discord) accounts. */
export function newLocalUserId(): string {
  return `${LOCAL_PREFIX}${crypto.randomUUID()}`;
}

export function isLocalUserId(id: string): boolean {
  return id.startsWith(LOCAL_PREFIX);
}

/** Discord snowflake: numeric string, typical length 17–20. */
export function isDiscordSnowflake(id: string): boolean {
  return /^\d{17,20}$/.test(id);
}
