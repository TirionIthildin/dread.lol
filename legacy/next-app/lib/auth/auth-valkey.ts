import crypto from "node:crypto";
import { getValkey } from "@/lib/valkey";

const PENDING_REG_PREFIX = "pending_reg:";
const PENDING_REG_EMAIL_PREFIX = "pending_reg_email:";
const SRP_LOGIN_PREFIX = "srp_login:";
const PENDING_REG_TTL = 60 * 60 * 24; // 24h
const SRP_LOGIN_TTL = 60 * 10; // 10 min

export interface PendingRegistration {
  userId: string;
  username: string;
  email: string;
  srpSalt: string;
  srpVerifier: string;
}

export async function setPendingRegistration(
  token: string,
  emailKey: string,
  payload: PendingRegistration
): Promise<void> {
  const redis = getValkey();
  const raw = JSON.stringify(payload);
  await redis.setex(`${PENDING_REG_PREFIX}${token}`, PENDING_REG_TTL, raw);
  await redis.setex(`${PENDING_REG_EMAIL_PREFIX}${emailKey}`, PENDING_REG_TTL, token);
}

/** Returns payload or null; deletes pending_reg and pending_reg_email keys (one-time). */
export async function consumePendingRegistration(token: string): Promise<PendingRegistration | null> {
  const redis = getValkey();
  const key = `${PENDING_REG_PREFIX}${token}`;
  const raw = await redis.get(key);
  if (raw === null) return null;
  await redis.del(key);
  let payload: PendingRegistration;
  try {
    payload = JSON.parse(raw) as PendingRegistration;
  } catch {
    return null;
  }
  const emailKey = payload.email.trim().toLowerCase();
  await redis.del(`${PENDING_REG_EMAIL_PREFIX}${emailKey}`);
  return payload;
}

export async function getPendingTokenForEmail(emailKey: string): Promise<string | null> {
  const redis = getValkey();
  return redis.get(`${PENDING_REG_EMAIL_PREFIX}${emailKey}`);
}

export interface SrpLoginState {
  username: string;
  salt: string;
  verifierHex: string;
  bHex: string;
  bPublicHex: string;
}

export async function setSrpLoginState(sessionId: string, state: SrpLoginState): Promise<void> {
  const redis = getValkey();
  await redis.setex(`${SRP_LOGIN_PREFIX}${sessionId}`, SRP_LOGIN_TTL, JSON.stringify(state));
}

export async function getSrpLoginState(sessionId: string): Promise<SrpLoginState | null> {
  const redis = getValkey();
  const raw = await redis.get(`${SRP_LOGIN_PREFIX}${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SrpLoginState;
  } catch {
    return null;
  }
}

export async function deleteSrpLoginState(sessionId: string): Promise<void> {
  const redis = getValkey();
  await redis.del(`${SRP_LOGIN_PREFIX}${sessionId}`);
}

export function newToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function newSrpSessionId(): string {
  return crypto.randomBytes(24).toString("base64url");
}
