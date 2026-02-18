/**
 * Session store in Valkey. Session ID is stored in a signed cookie.
 * AUTH_SECRET is used to sign the cookie; generate with: openssl rand -base64 32
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getValkey } from "@/lib/valkey";

const SESSION_COOKIE = "dread_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SESSION_PREFIX = "session:";
const OAUTH_STATE_PREFIX = "oauth:state:";
const OAUTH_STATE_TTL = 600; // 10 minutes (Discord redirect can be slow)

export interface SessionUser {
  sub: string;
  name?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string | null;
  /** Discord public_flags (badge bitfield). Used to store badges on user. */
  public_flags?: number;
}

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

export async function createSession(user: SessionUser): Promise<string> {
  const redis = getValkey();
  const id = crypto.randomBytes(24).toString("base64url");
  const key = SESSION_PREFIX + id;
  await redis.setex(key, SESSION_TTL_SECONDS, JSON.stringify(user));
  return sign(id);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const id = verify(raw);
  if (!id) return null;
  const redis = getValkey();
  const data = await redis.get(SESSION_PREFIX + id);
  if (!data) return null;
  return JSON.parse(data) as SessionUser;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (raw) {
    const id = verify(raw);
    if (id) {
      const redis = getValkey();
      await redis.del(SESSION_PREFIX + id);
    }
  }
}

export async function setOAuthState(state: string, codeVerifier: string): Promise<void> {
  const redis = getValkey();
  await redis.setex(OAUTH_STATE_PREFIX + state, OAUTH_STATE_TTL, codeVerifier);
}

/** Returns the stored value (or "" for Discord); null if state was not found or already used. One-time use: key is deleted after read. */
export async function consumeOAuthState(state: string): Promise<string | null> {
  const redis = getValkey();
  const key = OAUTH_STATE_PREFIX + state;
  const value = await redis.get(key);
  if (value !== null) await redis.del(key);
  return value;
}

export function getSessionCookieConfig(signedValue: string) {
  return {
    name: SESSION_COOKIE,
    value: signedValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
