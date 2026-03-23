/**
 * Short-lived Valkey state between primary auth and MFA verification.
 */
import crypto from "node:crypto";
import { getCookieDomain, shouldUseSecureCookies } from "@/lib/site";
import { getValkey } from "@/lib/valkey";
import type { SessionUser } from "@/lib/auth/session";

const MFA_PREFIX = "mfa_pending:";
const MFA_TTL_SECONDS = 600;

export const MFA_PENDING_COOKIE_NAME = "mfa_pending" as const;

export function getMfaPendingCookieConfig(token: string) {
  const domain = getCookieDomain();
  return {
    name: MFA_PENDING_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: MFA_TTL_SECONDS,
    ...(domain && { domain }),
  };
}

export function getMfaPendingCookieClearOptions() {
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

export async function setMfaPending(sessionUser: SessionUser): Promise<string> {
  const redis = getValkey();
  const token = crypto.randomBytes(32).toString("base64url");
  await redis.setex(MFA_PREFIX + token, MFA_TTL_SECONDS, JSON.stringify({ user: sessionUser }));
  return token;
}

/** Peek without consuming (e.g. invalid code retry). */
export async function getMfaPending(token: string): Promise<SessionUser | null> {
  const redis = getValkey();
  const raw = await redis.get(MFA_PREFIX + token);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as { user?: SessionUser };
    if (o.user && typeof o.user.sub === "string") return o.user;
  } catch {
    return null;
  }
  return null;
}

export async function deleteMfaPending(token: string): Promise<void> {
  const redis = getValkey();
  await redis.del(MFA_PREFIX + token);
}
