import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listWebAuthnCredentialsForUser } from "@/lib/auth/webauthn-credentials";
import { findLocalUserByUsername } from "@/lib/auth/local-account";
import { normalizeLocalUsername } from "@/lib/auth/username";
import { getWebAuthnRpId } from "@/lib/auth/webauthn-config";
import { newWebAuthnSessionKey, setAuthenticationChallenge } from "@/lib/auth/webauthn-challenge";
import { rateLimitByIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  username: z.string().min(1).max(40),
});

export async function POST(request: NextRequest) {
  const limit = await rateLimitByIp(request, "webauthn-login-options", 20, 60);
  if (!limit.allowed) return limit.response;

  try {
    const { username: raw } = bodySchema.parse(await request.json());
    const username = normalizeLocalUsername(raw);
    const user = await findLocalUserByUsername(username);
    if (!user?.emailVerifiedAt) {
      return NextResponse.json({ error: "Invalid request." }, { status: 401 });
    }

    const creds = await listWebAuthnCredentialsForUser(user._id);
    if (creds.length === 0) {
      return NextResponse.json({ error: "No passkeys on this account." }, { status: 404 });
    }

    const options = await generateAuthenticationOptions({
      rpID: getWebAuthnRpId(),
      allowCredentials: creds.map((c) => ({
        id: c.credentialId,
        transports: (c.transports ?? undefined) as
          | ("ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb")[]
          | undefined,
      })),
      userVerification: "preferred",
    });

    const sessionKey = newWebAuthnSessionKey();
    await setAuthenticationChallenge(sessionKey, options.challenge);

    return NextResponse.json({ options, sessionKey });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
