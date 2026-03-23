import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { getWebAuthnExpectedOrigin, getWebAuthnRpId } from "@/lib/auth/webauthn-config";
import { consumeRegistrationChallenge } from "@/lib/auth/webauthn-challenge";
import { saveWebAuthnCredential } from "@/lib/auth/webauthn-credentials";
import { findUserById } from "@/lib/auth/local-account";
import { requireSession } from "@/lib/auth/require-session";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const row = await findUserById(auth.session.sub);
  if (!row || row.authProvider !== "local" || !row.emailVerifiedAt) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const expectedChallenge = await consumeRegistrationChallenge(auth.session.sub);
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Challenge expired. Request new options." }, { status: 400 });
  }

  let body: { response: RegistrationResponseJSON };
  try {
    body = (await request.json()) as { response: RegistrationResponseJSON };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const origin = getWebAuthnExpectedOrigin();
  const rpID = getWebAuthnRpId();

  try {
    const verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const { registrationInfo } = verification;
    const credentialId = registrationInfo.credential.id;

    await saveWebAuthnCredential(auth.session.sub, {
      credentialId,
      publicKey: registrationInfo.credential.publicKey,
      counter: registrationInfo.credential.counter,
      transports: registrationInfo.credential.transports,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
