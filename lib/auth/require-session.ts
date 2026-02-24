/**
 * Centralized auth helpers for API routes.
 * Use requireSession() for any authenticated route; requireAdminSession() for admin-only.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import type { SessionUser } from "@/lib/auth/session";
import type { UserWithApproval } from "@/lib/member-profiles";

export type AuthResult =
  | { ok: true; session: SessionUser }
  | { ok: false; response: NextResponse };

export type AdminAuthResult =
  | { ok: true; session: SessionUser; user: UserWithApproval }
  | { ok: false; response: NextResponse };

/** Require a logged-in session. Returns auth result or 401 response. */
export async function requireSession(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, session };
}

/** Require a logged-in session and admin role. Returns auth result or 401/403 response. */
export async function requireAdminSession(): Promise<AdminAuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const user = await getOrCreateUser(session);
  if (!user.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Access denied" }, { status: 403 }),
    };
  }
  return { ok: true, session, user };
}
