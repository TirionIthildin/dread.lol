import { getValkey } from "@/lib/valkey";

const PREFIX = "totp_enroll:";
const TTL_SECONDS = 600;

export async function setTotpEnrollSecret(userId: string, secretBase32: string): Promise<void> {
  await getValkey().setex(PREFIX + userId, TTL_SECONDS, secretBase32);
}

export async function getTotpEnrollSecret(userId: string): Promise<string | null> {
  return getValkey().get(PREFIX + userId);
}

export async function clearTotpEnrollSecret(userId: string): Promise<void> {
  await getValkey().del(PREFIX + userId);
}
