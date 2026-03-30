import { NextResponse } from "next/server";
import { Secret, TOTP } from "otpauth";
import { findUserById } from "@/lib/auth/local-account";
import { requireSession } from "@/lib/auth/require-session";
import { setTotpEnrollSecret } from "@/lib/auth/totp-enroll-valkey";

export async function POST() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const user = await findUserById(auth.session.sub);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.authProvider === "local" && !user.emailVerifiedAt) {
    return NextResponse.json({ error: "Verify your email before enabling 2FA." }, { status: 403 });
  }
  if (user.totpEnabled) {
    return NextResponse.json({ error: "Two-factor is already enabled." }, { status: 400 });
  }

  const secret = new Secret({ size: 20 });
  const secretBase32 = secret.base32;
  await setTotpEnrollSecret(user._id, secretBase32);

  const label = (user.username ?? user.displayName ?? user._id).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64);
  const totp = new TOTP({
    issuer: "Dread.lol",
    label: label || "user",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return NextResponse.json({
    otpauthUrl: totp.toString(),
    secretBase32,
  });
}
