import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { Binary } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  findCredentialByCredentialId,
  updateCredentialCounter,
} from "@/lib/auth/webauthn-credentials";
import { findUserById } from "@/lib/auth/local-account";
import { setMfaPending } from "@/lib/auth/mfa-pending";
import { createSession, getSessionCookieConfig } from "@/lib/auth/session";
import { getWebAuthnExpectedOrigin, getWebAuthnRpId } from "@/lib/auth/webauthn-config";
import { consumeAuthenticationChallenge } from "@/lib/auth/webauthn-challenge";
import { getClientIp, rateLimitByIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  sessionKey: z.string().min(1),
  response: z.custom<AuthenticationResponseJSON>(),
});

export async function POST(request: NextRequest) {
  const limit = await rateLimitByIp(request, "webauthn-login-verify", 30, 60);
  if (!limit.allowed) return limit.response;

  try {
    const body = bodySchema.parse(await request.json());
    const expectedChallenge = await consumeAuthenticationChallenge(body.sessionKey);
    if (!expectedChallenge) {
      return NextResponse.json({ error: "Challenge expired." }, { status: 400 });
    }

    const credId = body.response.id;
    const credDoc = await findCredentialByCredentialId(credId);
    if (!credDoc) {
      return NextResponse.json({ error: "Unknown credential." }, { status: 400 });
    }

    const user = await findUserById(credDoc.userId);
    if (!user || user.authProvider !== "local" || !user.emailVerifiedAt) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const pkRaw = credDoc.publicKey;
    const pkBuf = Buffer.isBuffer(pkRaw)
      ? pkRaw
      : pkRaw instanceof Binary
        ? Buffer.from(pkRaw.buffer)
        : Buffer.from(pkRaw as Uint8Array);

    const origin = getWebAuthnExpectedOrigin();
    const rpID = getWebAuthnRpId();

    const verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credDoc.credentialId,
        publicKey: new Uint8Array(pkBuf),
        counter: credDoc.counter,
      },
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    await updateCredentialCounter(credDoc.credentialId, verification.authenticationInfo.newCounter);

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
      return NextResponse.json({ ok: true, needsMfa: true, mfaToken });
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
    const res = NextResponse.json({ ok: true });
    const { name, value, ...opts } = config;
    res.cookies.set(name, value, opts);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
