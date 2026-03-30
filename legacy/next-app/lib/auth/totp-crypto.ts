/**
 * Encrypt TOTP secrets at rest using HKDF-derived key from AUTH_SECRET + user id.
 */
import crypto from "node:crypto";

function getAuthSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function deriveKey(userId: string): Buffer {
  const raw = crypto.hkdfSync("sha256", Buffer.from(getAuthSecret(), "utf8"), Buffer.from(userId, "utf8"), "dread-totp-v1", 32);
  return Buffer.from(raw);
}

export function encryptTotpSecret(plainBase32: string, userId: string): string {
  const key = deriveKey(userId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plainBase32, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptTotpSecret(stored: string, userId: string): string | null {
  try {
    const buf = Buffer.from(stored, "base64");
    if (buf.length < 12 + 16 + 1) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const key = deriveKey(userId);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}
