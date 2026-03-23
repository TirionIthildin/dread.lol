import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserById } from "@/lib/auth/local-account";
import {
  deleteMfaPending,
  getMfaPending,
  getMfaPendingCookieClearOptions,
  MFA_PENDING_COOKIE_NAME,
} from "@/lib/auth/mfa-pending";
import { getClientIp, rateLimitByIp } from "@/lib/rate-limit";
import { createSession, getSessionCookieConfig } from "@/lib/auth/session";
import { verifyUserTotpOrBackup } from "@/lib/auth/totp-verify";
import { removeBackupCodeAtIndex } from "@/lib/auth/totp-user-db";

const bodySchema = z.object({
  code: z.string().min(1),
  mfaToken: z.string().min(1).optional(),
});

const WINDOW_LIMIT = 30;
const WINDOW_SEC = 60;

export async function POST(request: NextRequest) {
  const limit = await rateLimitByIp(request, "mfa-verify", WINDOW_LIMIT, WINDOW_SEC);
  if (!limit.allowed) return limit.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const cookieToken = request.cookies.get(MFA_PENDING_COOKIE_NAME)?.value;
  const mfaToken = body.mfaToken ?? cookieToken;
  if (!mfaToken) {
    return NextResponse.json({ error: "Missing MFA token" }, { status: 400 });
  }

  const pending = await getMfaPending(mfaToken);
  if (!pending) {
    return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }

  const user = await findUserById(pending.sub);
  if (!user?.totpEnabled) {
    await deleteMfaPending(mfaToken);
    return NextResponse.json({ error: "Two-factor is not enabled." }, { status: 400 });
  }

  const v = verifyUserTotpOrBackup(user, body.code);
  if (!v.ok) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  if (v.backupIndex !== undefined) {
    await removeBackupCodeAtIndex(user._id, v.backupIndex);
  }

  await deleteMfaPending(mfaToken);

  const sessionValue = await createSession(pending, {
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  const config = getSessionCookieConfig(sessionValue);
  const res = NextResponse.json({ ok: true });
  const { name, value, ...opts } = config;
  res.cookies.set(name, value, opts);
  res.cookies.set(MFA_PENDING_COOKIE_NAME, "", getMfaPendingCookieClearOptions());
  return res;
}
