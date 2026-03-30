/**
 * Valkey (Redis-compatible) client for session and OAuth state storage.
 * VALKEY_URL defaults to redis://localhost:6379 for local dev.
 */
import Redis from "ioredis";

const VALKEY_URL = process.env.VALKEY_URL ?? "redis://localhost:6379";

let client: Redis | null = null;

export function getValkey(): Redis {
  if (!client) {
    client = new Redis(VALKEY_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
  }
  return client;
}

export async function withValkey<T>(fn: (redis: Redis) => Promise<T>): Promise<T> {
  const redis = getValkey();
  return fn(redis);
}
