import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteSrpLoginState, getSrpLoginState } from "@/lib/auth/auth-valkey";
import { findLocalUserByUsername } from "@/lib/auth/local-account";
import { setMfaPending } from "@/lib/auth/mfa-pending";
import { createSession, getSessionCookieConfig } from "@/lib/auth/session";
import { getClientIp, rateLimitByIp } from "@/lib/rate-limit";
import { SrpServerSession } from "@/lib/srp/srp6a";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  A: z.string().min(2),
  M1: z.string().regex(/^[0-9a-fA-F]{64}$/),
});

const LOGIN_COMPLETE_LIMIT = 30;
const LOGIN_COMPLETE_WINDOW = 60;

export async function POST(request: NextRequest) {
  const limit = await rateLimitByIp(request, "srp-login-complete", LOGIN_COMPLETE_LIMIT, LOGIN_COMPLETE_WINDOW);
  if (!limit.allowed) return limit.response;

  try {
    const body = bodySchema.parse(await request.json());
    const state = await getSrpLoginState(body.sessionId);
    if (!state) {
      return NextResponse.json({ error: "Session expired. Start login again." }, { status: 400 });
    }

    const server = SrpServerSession.fromStored(
      state.username,
      state.salt,
      state.verifierHex,
      state.bHex,
      state.bPublicHex
    );
    server.setClientPublic(body.A);
    let m2: string;
    try {
      m2 = server.verifyClientProof(body.M1);
    } catch {
      await deleteSrpLoginState(body.sessionId);
      return NextResponse.json({ error: "Invalid proof." }, { status: 401 });
    }

    await deleteSrpLoginState(body.sessionId);

    const user = await findLocalUserByUsername(state.username);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.totpEnabled) {
      const pendingUser = {
        sub: user._id,
        auth_provider: "local" as const,
        name: user.displayName ?? user.username ?? "Member",
        preferred_username: user.username ?? undefined,
        email: user.email ?? undefined,
        picture: user.avatarUrl ?? null,
      };
      const mfaToken = await setMfaPending(pendingUser);
      return NextResponse.json({ ok: true, M2: m2, needsMfa: true, mfaToken });
    }

    const sessionValue = await createSession(
      {
        sub: user._id,
        auth_provider: "local",
        name: user.displayName ?? user.username ?? "Member",
        preferred_username: user.username ?? undefined,
        email: user.email ?? undefined,
        picture: user.avatarUrl ?? null,
      },
      { ip: getClientIp(request), userAgent: request.headers.get("user-agent") }
    );
    const config = getSessionCookieConfig(sessionValue);
    const res = NextResponse.json({ ok: true, M2: m2 });
    const { name, value, ...opts } = config;
    res.cookies.set(name, value, opts);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
