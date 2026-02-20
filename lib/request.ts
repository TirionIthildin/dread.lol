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

/** Parse host from RFC 7239 Forwarded header, e.g. "host=username.dread.lol" */
function parseForwardedHost(forwarded: string): string | null {
  const hostMatch = forwarded.match(/host=["']?([^"';,\s]+)["']?/i);
  return hostMatch ? hostMatch[1] : null;
}

/** Get base domain for subdomain detection (e.g. "dread.lol"). */
function getBaseDomain(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_DOMAIN?.trim();
  if (explicit) return explicit.replace(/^www\./i, "");
  try {
    const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_HOME_URL || "https://dread.lol";
    const host = new URL(url).hostname;
    return host.replace(/^www\./i, "");
  } catch {
    return "dread.lol";
  }
}

/**
 * Extract profile slug from request host (for subdomain routing, e.g. username.dread.lol).
 * Cloudflare Worker sets X-Original-Host (Coolify/Traefik overwrites X-Forwarded-Host).
 * Fallbacks: x-forwarded-host, host, x-real-host, forwarded.
 */
export function getProfileSlugFromHost(requestHeaders: Headers): string | null {
  const originalHost = requestHeaders.get("x-original-host"); // Worker sets this; proxy won't overwrite
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const hostHeader = requestHeaders.get("host");
  const realHost = requestHeaders.get("x-real-host");
  const forwarded = requestHeaders.get("forwarded");

  const rawHost =
    originalHost ||
    forwardedHost ||
    hostHeader ||
    realHost ||
    (forwarded ? parseForwardedHost(forwarded) : null) ||
    "";
  // Handle comma-separated values (e.g. "alice.dread.lol, dread.lol")—use first (original)
  const hostname = (rawHost.split(",")[0] ?? "").split(":")[0]?.trim().toLowerCase() || "";
  if (!hostname) return null;

  const base = getBaseDomain().toLowerCase();
  const baseWithDot = `.${base}`;

  if (hostname.endsWith(baseWithDot) && hostname !== base) {
    const subdomain = hostname.slice(0, -baseWithDot.length);
    if (subdomain && subdomain.length > 0) return subdomain;
  }

  // Fallback: simple subdomain detection (e.g. for alternate configs)
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const first = parts[0];
    if (first && first.length > 0) return first;
  }
  return null;
}
