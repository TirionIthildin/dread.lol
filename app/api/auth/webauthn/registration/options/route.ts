import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getWebAuthnRpId, WEBAUTHN_RP_NAME } from "@/lib/auth/webauthn-config";
import { setRegistrationChallenge } from "@/lib/auth/webauthn-challenge";
import { findUserById } from "@/lib/auth/local-account";
import { requireSession } from "@/lib/auth/require-session";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const row = await findUserById(auth.session.sub);
  if (!row?.emailVerifiedAt) {
    return NextResponse.json({ error: "Verify your email before adding a passkey." }, { status: 403 });
  }

  const userName = row.username ?? row.displayName ?? "user";
  const options = await generateRegistrationOptions({
    rpName: WEBAUTHN_RP_NAME,
    rpID: getWebAuthnRpId(),
    userName,
    userDisplayName: row.displayName ?? userName,
    userID: new TextEncoder().encode(auth.session.sub),
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await setRegistrationChallenge(auth.session.sub, options.challenge);

  return NextResponse.json(options);
}
