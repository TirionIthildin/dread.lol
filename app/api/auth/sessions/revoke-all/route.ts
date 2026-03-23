import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import {
  getSessionCookieClearOptions,
  revokeAllSessionsForUser,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

/** POST: sign out everywhere (all devices). */
export async function POST() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  await revokeAllSessionsForUser(auth.session.sub);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
  return res;
}
