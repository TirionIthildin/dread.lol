import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { getCurrentSessionId, listSessionsForUser } from "@/lib/auth/session";

/** GET: list active sessions for the signed-in user. */
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const [sessions, currentSessionId] = await Promise.all([
    listSessionsForUser(auth.session.sub),
    getCurrentSessionId(),
  ]);
  return NextResponse.json({ sessions, currentSessionId });
}
