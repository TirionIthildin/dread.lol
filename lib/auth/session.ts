/**
 * Session store in Valkey. Session ID is stored in a signed cookie.
 * AUTH_SECRET is used to sign the cookie; generate with: openssl rand -base64 32
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getCookieDomain, shouldUseSecureCookies } from "@/lib/site";
import { getValkey } from "@/lib/valkey";

/** Exported for logout and any route that must clear the cookie with matching attributes. */
export const SESSION_COOKIE_NAME = "dread_session" as const;
const SESSION_COOKIE = SESSION_COOKIE_NAME;
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SESSION_PREFIX = "session:";
const USER_SESSIONS_PREFIX = "user_sessions:";
const OAUTH_STATE_PREFIX = "oauth:state:";
const OAUTH_STATE_TTL = 600; // 10 minutes (Discord redirect can be slow)
const MAX_UA_LEN = 512;
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export interface SessionUser {
  sub: string;
  name?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string | null;
  /** Discord public_flags (badge bitfield). Used to store badges on user. */
  public_flags?: number;
  /** Discord premium_type (0=None, 1=Nitro Classic, 2=Nitro, 3=Nitro Basic). */
  premium_type?: number;
  /** `local` for username/email/SRP/WebAuthn accounts; omit or `discord` for Discord OAuth. */
  auth_provider?: "discord" | "local";
  /** Normalized email for local accounts (optional). */
  email?: string | null;
}

export interface SessionMeta {
  createdAt: number;
  lastSeenAt: number;
  userAgent: string | null;
  ip: string | null;
}

interface StoredSessionV2 {
  v: 2;
  user: SessionUser;
  meta: SessionMeta;
}

export type SessionListEntry = {
  sessionId: string;
  createdAt: number;
  lastSeenAt: number;
  userAgent: string | null;
  ip: string | null;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(value: string): string {
  const secret = getSecret();
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(value);
  return value + "." + hmac.digest("base64url");
}

function verify(signed: string): string | null {
  const i = signed.lastIndexOf(".");
  if (i === -1) return null;
  const value = signed.slice(0, i);
  const expected = sign(value);
  if (expected !== signed) return null;
  return value;
}

function capUa(ua: string | undefined | null): string | null {
  if (!ua || typeof ua !== "string") return null;
  const t = ua.trim();
  if (!t) return null;
  return t.length > MAX_UA_LEN ? t.slice(0, MAX_UA_LEN) : t;
}

/** Parse session blob (v2 wrapped or legacy plain SessionUser JSON). */
export function parseStoredSession(raw: string): { user: SessionUser; meta: SessionMeta } | null {
  try {
    const o: unknown = JSON.parse(raw);
    if (!o || typeof o !== "object") return null;
    const rec = o as Record<string, unknown>;
    if (rec.v === 2 && rec.user && typeof rec.user === "object" && typeof (rec.user as SessionUser).sub === "string") {
      const meta = rec.meta as SessionMeta | undefined;
      return {
        user: rec.user as SessionUser,
        meta: {
          createdAt: typeof meta?.createdAt === "number" ? meta.createdAt : Date.now(),
          lastSeenAt: typeof meta?.lastSeenAt === "number" ? meta.lastSeenAt : Date.now(),
          userAgent: typeof meta?.userAgent === "string" ? meta.userAgent : null,
          ip: typeof meta?.ip === "string" ? meta.ip : null,
        },
      };
    }
    if (typeof rec.sub === "string") {
      const now = Date.now();
      return {
        user: o as SessionUser,
        meta: { createdAt: now, lastSeenAt: now, userAgent: null, ip: null },
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function createSession(
  user: SessionUser,
  requestMeta?: { ip?: string | null; userAgent?: string | null }
): Promise<string> {
  const redis = getValkey();
  const id = crypto.randomBytes(24).toString("base64url");
  const key = SESSION_PREFIX + id;
  const now = Date.now();
  const stored: StoredSessionV2 = {
    v: 2,
    user,
    meta: {
      createdAt: now,
      lastSeenAt: now,
      userAgent: capUa(requestMeta?.userAgent ?? undefined),
      ip: requestMeta?.ip ?? null,
    },
  };
  await redis.setex(key, SESSION_TTL_SECONDS, JSON.stringify(stored));
  await redis.sadd(USER_SESSIONS_PREFIX + user.sub, id);
  return sign(id);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const id = verify(raw);
  if (!id) return null;
  const redis = getValkey();
  const key = SESSION_PREFIX + id;
  const data = await redis.get(key);
  if (!data) return null;
  const parsed = parseStoredSession(data);
  if (!parsed) return null;
  const { user, meta } = parsed;
  const now = Date.now();
  if (now - meta.lastSeenAt > LAST_SEEN_THROTTLE_MS) {
    meta.lastSeenAt = now;
    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      const stored: StoredSessionV2 = { v: 2, user, meta };
      await redis.setex(key, ttl, JSON.stringify(stored));
    }
  }
  return user;
}

/** Raw session id from the current cookie (for matching “this device”). */
export async function getCurrentSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verify(raw);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (raw) {
    const id = verify(raw);
    if (id) {
      const redis = getValkey();
      const key = SESSION_PREFIX + id;
      const data = await redis.get(key);
      await redis.del(key);
      if (data) {
        const parsed = parseStoredSession(data);
        if (parsed) {
          await redis.srem(USER_SESSIONS_PREFIX + parsed.user.sub, id);
        }
      }
    }
  }
}

const OAUTH_STATE_PROVIDERS = { discord: "", roblox: "roblox:" } as const;

export async function setOAuthState(
  state: string,
  codeVerifier: string,
  provider: keyof typeof OAUTH_STATE_PROVIDERS = "discord"
): Promise<void> {
  const redis = getValkey();
  const prefix = OAUTH_STATE_PREFIX + OAUTH_STATE_PROVIDERS[provider];
  await redis.setex(prefix + state, OAUTH_STATE_TTL, codeVerifier);
}

/** Returns the stored value (or "" for Discord); null if state was not found or already used. One-time use: key is deleted after read. */
export async function consumeOAuthState(
  state: string,
  provider: keyof typeof OAUTH_STATE_PROVIDERS = "discord"
): Promise<string | null> {
  const redis = getValkey();
  const prefix = OAUTH_STATE_PREFIX + OAUTH_STATE_PROVIDERS[provider];
  const key = prefix + state;
  const value = await redis.get(key);
  if (value !== null) await redis.del(key);
  return value;
}

export function getSessionCookieConfig(signedValue: string) {
  const domain = getCookieDomain();
  return {
    name: SESSION_COOKIE,
    value: signedValue,
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    ...(domain && { domain }),
  };
}

/**
 * Clearing the session cookie must use the same Domain, Path, Secure, HttpOnly, and SameSite
 * as when the cookie was set, or browsers may keep the old cookie (especially on wildcard hosts).
 */
export function getSessionCookieClearOptions() {
  const domain = getCookieDomain();
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    ...(domain && { domain }),
  };
}

/** List active sessions for a user (stale ids are removed from the index). */
export async function listSessionsForUser(userId: string): Promise<SessionListEntry[]> {
  const redis = getValkey();
  const ids = await redis.smembers(USER_SESSIONS_PREFIX + userId);
  const out: SessionListEntry[] = [];
  const setKey = USER_SESSIONS_PREFIX + userId;
  for (const id of ids) {
    const key = SESSION_PREFIX + id;
    const data = await redis.get(key);
    if (!data) {
      await redis.srem(setKey, id);
      continue;
    }
    const parsed = parseStoredSession(data);
    if (!parsed) continue;
    out.push({
      sessionId: id,
      createdAt: parsed.meta.createdAt,
      lastSeenAt: parsed.meta.lastSeenAt,
      userAgent: parsed.meta.userAgent,
      ip: parsed.meta.ip,
    });
  }
  out.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  return out;
}

/** Revoke a single session (e.g. another device). Returns false if not found or not owned. */
export async function revokeSessionForUser(userId: string, sessionId: string): Promise<boolean> {
  const redis = getValkey();
  const setKey = USER_SESSIONS_PREFIX + userId;
  const isMember = await redis.sismember(setKey, sessionId);
  if (!isMember) return false;
  const key = SESSION_PREFIX + sessionId;
  const data = await redis.get(key);
  if (data) {
    const parsed = parseStoredSession(data);
    if (!parsed || parsed.user.sub !== userId) return false;
  }
  await redis.del(key);
  await redis.srem(setKey, sessionId);
  return true;
}

/** Delete all sessions for a user. Returns how many session keys were removed. */
export async function revokeAllSessionsForUser(userId: string): Promise<number> {
  const redis = getValkey();
  const setKey = USER_SESSIONS_PREFIX + userId;
  const ids = await redis.smembers(setKey);
  let n = 0;
  for (const id of ids) {
    await redis.del(SESSION_PREFIX + id);
    n++;
  }
  await redis.del(setKey);
  return n;
}
