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
