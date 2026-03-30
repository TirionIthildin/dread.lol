import { NextRequest, NextResponse } from "next/server";
import { Secret, TOTP } from "otpauth";
import { z } from "zod";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/db/schema";
import { findUserById } from "@/lib/auth/local-account";
import { requireSession } from "@/lib/auth/require-session";
import { encryptTotpSecret } from "@/lib/auth/totp-crypto";
import { generateBackupCode, hashBackupCode } from "@/lib/auth/totp-backup";
import { clearTotpEnrollSecret, getTotpEnrollSecret } from "@/lib/auth/totp-enroll-valkey";

const bodySchema = z.object({
  code: z.string().min(6).max(12),
});

const BACKUP_COUNT = 10;

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const user = await findUserById(auth.session.sub);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.totpEnabled) {
    return NextResponse.json({ error: "Two-factor is already enabled." }, { status: 400 });
  }

  const enrollSecret = await getTotpEnrollSecret(user._id);
  if (!enrollSecret) {
    return NextResponse.json({ error: "Enrollment expired. Start again." }, { status: 400 });
  }

  const digits = body.code.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(digits)) {
    return NextResponse.json({ error: "Enter the 6-digit code from your app." }, { status: 400 });
  }

  const delta = TOTP.validate({
    token: digits,
    secret: Secret.fromBase32(enrollSecret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    window: 1,
  });
  if (delta === null) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const enc = encryptTotpSecret(enrollSecret, user._id);
  const backupCodes = Array.from({ length: BACKUP_COUNT }, () => generateBackupCode());
  const hashes = backupCodes.map(hashBackupCode);

  const client = await getDb();
  const dbName = await getDbName();
  await client
    .db(dbName)
    .collection<UserDoc>(COLLECTIONS.users)
    .updateOne(
      { _id: user._id },
      {
        $set: {
          totpEnabled: true,
          totpSecretEnc: enc,
          totpBackupCodesHash: hashes,
          updatedAt: new Date(),
        },
      }
    );

  await clearTotpEnrollSecret(user._id);

  return NextResponse.json({ ok: true, backupCodes });
}
