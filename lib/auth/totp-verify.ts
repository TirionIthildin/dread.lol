import { Secret, TOTP } from "otpauth";
import type { UserDoc } from "@/lib/db/schema";
import { findMatchingBackupCodeHash } from "@/lib/auth/totp-backup";
import { decryptTotpSecret } from "@/lib/auth/totp-crypto";

export function verifyUserTotpOrBackup(
  user: UserDoc,
  code: string
): { ok: boolean; backupIndex?: number } {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false };
  const digits = trimmed.replace(/\s/g, "");
  if (/^\d{6}$/.test(digits)) {
    const enc = user.totpSecretEnc;
    if (!enc) return { ok: false };
    const plain = decryptTotpSecret(enc, user._id);
    if (!plain) return { ok: false };
    const delta = TOTP.validate({
      token: digits,
      secret: Secret.fromBase32(plain),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      window: 1,
    });
    return { ok: delta !== null };
  }
  const hashes = user.totpBackupCodesHash ?? [];
  const idx = findMatchingBackupCodeHash(trimmed, hashes);
  if (idx >= 0) return { ok: true, backupIndex: idx };
  return { ok: false };
}
