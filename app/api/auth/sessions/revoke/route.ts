import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/require-session";
import {
  getCurrentSessionId,
  getSessionCookieClearOptions,
  revokeSessionForUser,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

/** POST: revoke one session (another device or this one). Clears cookie if it was the current session. */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const currentId = await getCurrentSessionId();
  const ok = await revokeSessionForUser(auth.session.sub, body.sessionId);
  if (!ok) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const res = NextResponse.json({
    ok: true,
    loggedOut: currentId !== null && body.sessionId === currentId,
  });
  if (currentId !== null && body.sessionId === currentId) {
    res.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
  }
  return res;
}
