import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { newSrpSessionId, setSrpLoginState } from "@/lib/auth/auth-valkey";
import { findLocalUserByUsername } from "@/lib/auth/local-account";
import { normalizeLocalUsername } from "@/lib/auth/username";
import { rateLimitByIp } from "@/lib/rate-limit";
import { SrpServerSession } from "@/lib/srp/srp6a";

const bodySchema = z.object({
  username: z.string().min(1).max(40),
});

const LOGIN_START_LIMIT = 20;
const LOGIN_START_WINDOW = 60;

export async function POST(request: NextRequest) {
  const limit = await rateLimitByIp(request, "srp-login-start", LOGIN_START_LIMIT, LOGIN_START_WINDOW);
  if (!limit.allowed) return limit.response;

  try {
    const { username: raw } = bodySchema.parse(await request.json());
    const username = normalizeLocalUsername(raw);
    const user = await findLocalUserByUsername(username);
    if (!user || !user.srpSalt || !user.srpVerifier) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }
    if (!user.emailVerifiedAt) {
      return NextResponse.json({ error: "Email not verified." }, { status: 403 });
    }

    const server = new SrpServerSession(username, user.srpSalt, user.srpVerifier);
    const sessionId = newSrpSessionId();
    await setSrpLoginState(sessionId, {
      username,
      salt: user.srpSalt,
      verifierHex: user.srpVerifier,
      bHex: server.bHex,
      bPublicHex: server.publicValue,
    });

    return NextResponse.json({
      sessionId,
      salt: user.srpSalt,
      B: server.publicValue,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
