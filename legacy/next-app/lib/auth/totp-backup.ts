import crypto from "node:crypto";

const SALT_LEN = 16;

export function generateBackupCode(): string {
  const b = crypto.randomBytes(4);
  const h = b.toString("hex").toUpperCase();
  return `${h.slice(0, 4)}-${h.slice(4, 8)}`;
}

export function hashBackupCode(code: string): string {
  const normalized = code.replace(/[\s-]/g, "").toUpperCase();
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = crypto.scryptSync(normalized, salt, 32);
  return Buffer.concat([salt, hash]).toString("base64");
}

/** Returns index of matched hash or -1. */
export function findMatchingBackupCodeHash(
  code: string,
  hashes: readonly string[]
): number {
  const normalized = code.replace(/[\s-]/g, "").toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    try {
      const buf = Buffer.from(hashes[i], "base64");
      if (buf.length < SALT_LEN + 16) continue;
      const salt = buf.subarray(0, SALT_LEN);
      const expected = buf.subarray(SALT_LEN);
      const hash = crypto.scryptSync(normalized, salt, 32);
      if (hash.length === expected.length && crypto.timingSafeEqual(hash, expected)) {
        return i;
      }
    } catch {
      continue;
    }
  }
  return -1;
}
