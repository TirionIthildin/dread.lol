import { headers } from "next/headers";
import { getBaseDomain as getSiteBaseDomain } from "@/lib/site";

/**
 * Get client IP from request headers.
 * Cloudflare: cf-connecting-ip (primary), true-client-ip (Enterprise), x-forwarded-for (append-only).
 * Per Cloudflare docs: prefer CF-Connecting-IP over X-Forwarded-For for consistent single-IP format.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const cf = h.get("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();
  const trueClient = h.get("true-client-ip");
  if (trueClient?.trim()) return trueClient.trim();
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

/** Get Referer header for analytics (where the visitor came from). */
export async function getReferer(): Promise<string | null> {
  const h = await headers();
  return h.get("referer");
}

/**
 * Get visitor country from Cloudflare CF-IPCountry (ISO 3166-1 Alpha 2).
 * Requires "Add visitor location headers" Managed Transform in Cloudflare.
 * Note: Removed when Worker forwards to non‑Cloudflare origin.
 */
export async function getCfCountry(): Promise<string | null> {
  const h = await headers();
  const cc = h.get("cf-ipcountry");
  if (!cc?.trim() || cc === "XX" || cc === "T1") return null;
  return cc.trim().toUpperCase();
}

/** Parse host from RFC 7239 Forwarded header, e.g. "host=username.dread.lol" */
function parseForwardedHost(forwarded: string): string | null {
  const hostMatch = forwarded.match(/host=["']?([^"';,\s]+)["']?/i);
  return hostMatch ? hostMatch[1] : null;
}

/** Get base domain for subdomain detection (e.g. "dread.lol"). */
function getBaseDomain(): string {
  return getSiteBaseDomain();
}

/**
 * Extract profile slug from request host (for subdomain routing, e.g. username.dread.lol).
 * Cloudflare Worker sets X-Original-Host (Coolify/Traefik overwrites X-Forwarded-Host).
 * Fallbacks: x-forwarded-host, host, x-real-host, forwarded.
 *
 * SECURITY: We trust x-forwarded-* and similar headers from the reverse proxy.
 * Ensure production proxies (Cloudflare, Traefik, etc.) are configured to strip or
 * override these headers from untrusted clients to prevent spoofing.
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
