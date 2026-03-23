import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/db/schema";
import { findUserById } from "@/lib/auth/local-account";
import { requireSession } from "@/lib/auth/require-session";
import { generateBackupCode, hashBackupCode } from "@/lib/auth/totp-backup";
import { verifyUserTotpOrBackup } from "@/lib/auth/totp-verify";
import { removeBackupCodeAtIndex } from "@/lib/auth/totp-user-db";

const bodySchema = z.object({
  code: z.string().min(1),
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
  if (!user?.totpEnabled) {
    return NextResponse.json({ error: "Two-factor is not enabled." }, { status: 400 });
  }

  const v = verifyUserTotpOrBackup(user, body.code);
  if (!v.ok) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  if (v.backupIndex !== undefined) {
    await removeBackupCodeAtIndex(user._id, v.backupIndex);
  }

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
          totpBackupCodesHash: hashes,
          updatedAt: new Date(),
        },
      }
    );

  return NextResponse.json({ ok: true, backupCodes });
}
