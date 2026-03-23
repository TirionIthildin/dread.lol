import { getCanonicalOrigin } from "@/lib/site";

export function getWebAuthnRpId(): string {
  const explicit = process.env.WEBAUTHN_RP_ID?.trim();
  if (explicit) return explicit;
  try {
    return new URL(getCanonicalOrigin()).hostname;
  } catch {
    return "localhost";
  }
}

export function getWebAuthnExpectedOrigin(): string {
  const explicit = process.env.WEBAUTHN_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return getCanonicalOrigin().replace(/\/$/, "");
}

export const WEBAUTHN_RP_NAME = "Dread.Lol";
