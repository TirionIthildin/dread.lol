/**
 * Simple rate limiting using Valkey (Redis).
 * Uses sliding window: key = prefix:identifier, value = count, TTL = window seconds.
 */
import { getValkey } from "@/lib/valkey";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Check and increment rate limit.
 * @param key - Full Redis key (e.g. "ratelimit:upload:user123" or "ratelimit:report:ip1.2.3.4")
 * @param limit - Max requests per window
 * @param windowSeconds - Window duration in seconds
 * @returns Whether the request is allowed and remaining count
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const redis = getValkey();
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `${key}:${Math.floor(now / windowSeconds)}`;
    const count = await redis.incr(windowKey);
    if (count === 1) await redis.expire(windowKey, windowSeconds * 2);
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetIn = windowSeconds - (now % windowSeconds);
    return { allowed, remaining, resetIn };
  } catch {
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }
}

/** Get client IP from request (Cloudflare or X-Forwarded-For). */
export function getClientIp(request: Request): string | null {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return null;
}

/**
 * Rate limit by IP. Returns 429 response if exceeded.
 */
export async function rateLimitByIp(
  request: Request,
  prefix: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  const ip = getClientIp(request) ?? "unknown";
  const key = `ratelimit:${prefix}:ip:${ip}`;
  const result = await rateLimit(key, limit, windowSeconds);
  if (!result.allowed) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.resetIn),
          },
        }
      ),
    };
  }
  return { allowed: true };
}

/**
 * Rate limit by user ID (from session). Use for authenticated endpoints.
 */
export async function rateLimitByUser(
  userId: string,
  prefix: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  const key = `ratelimit:${prefix}:user:${userId}`;
  const result = await rateLimit(key, limit, windowSeconds);
  if (!result.allowed) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.resetIn),
          },
        }
      ),
    };
  }
  return { allowed: true };
}
