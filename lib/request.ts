import { headers } from "next/headers";

/** Get client IP from request headers (proxies set x-forwarded-for or x-real-ip). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "0.0.0.0";
  const real = h.get("x-real-ip");
  if (real) return real;
  return "0.0.0.0";
}

export async function getUserAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent");
}

/**
 * Extract profile slug from request host (for subdomain routing, e.g. username.dread.lol).
 * Cloudflare/Traefik pass the original host via x-forwarded-host; fallback to host.
 * Returns the first label (subdomain) when host has multiple parts, or null if no subdomain.
 */
export function getProfileSlugFromHost(requestHeaders: Headers): string | null {
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "";
  const parts = host.split(".");
  // Need subdomain: e.g. username.dread.lol -> 3+ parts, dread.lol -> 2 parts
  if (parts.length < 3) return null;
  const username = parts[0];
  return username && username.length > 0 ? username : null;
}
