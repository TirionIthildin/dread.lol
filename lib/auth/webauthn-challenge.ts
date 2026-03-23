import crypto from "node:crypto";
import { getValkey } from "@/lib/valkey";

const REG_PREFIX = "webauthn_reg:";
const AUTH_PREFIX = "webauthn_auth:";
const TTL = 60 * 5;

export async function setRegistrationChallenge(userId: string, challenge: string): Promise<void> {
  const redis = getValkey();
  await redis.setex(`${REG_PREFIX}${userId}`, TTL, challenge);
}

export async function consumeRegistrationChallenge(userId: string): Promise<string | null> {
  const redis = getValkey();
  const key = `${REG_PREFIX}${userId}`;
  const v = await redis.get(key);
  if (v !== null) await redis.del(key);
  return v;
}

export async function setAuthenticationChallenge(sessionKey: string, challenge: string): Promise<void> {
  const redis = getValkey();
  await redis.setex(`${AUTH_PREFIX}${sessionKey}`, TTL, challenge);
}

export async function consumeAuthenticationChallenge(sessionKey: string): Promise<string | null> {
  const redis = getValkey();
  const key = `${AUTH_PREFIX}${sessionKey}`;
  const v = await redis.get(key);
  if (v !== null) await redis.del(key);
  return v;
}

export function newWebAuthnSessionKey(): string {
  return crypto.randomBytes(24).toString("base64url");
}
