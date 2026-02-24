/**
 * Debug endpoint for subdomain routing.
 * Admin-only: visit username.dread.lol/api/debug/headers when signed in as admin.
 */
import { NextResponse } from "next/server";
import { getProfileSlugFromHost } from "@/lib/request";
import { requireAdmin } from "@/app/dashboard/actions";

const SENSITIVE_HEADERS = new Set([
  "authorization", "cookie", "x-api-key", "x-auth-token",
  "proxy-authorization", "set-cookie",
]);

function redactHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    out[key] = SENSITIVE_HEADERS.has(lower) ? "[redacted]" : value;
  });
  return out;
}

export async function GET(request: Request) {
  const err = await requireAdmin();
  if (err) return NextResponse.json({ error: err }, { status: 401 });

  const slug = getProfileSlugFromHost(request.headers);

  return NextResponse.json({
    host: request.headers.get("host"),
    "x-original-host": request.headers.get("x-original-host"),
    "x-forwarded-host": request.headers.get("x-forwarded-host"),
    "x-real-host": request.headers.get("x-real-host"),
    forwarded: request.headers.get("forwarded"),
    "cf-connecting-ip": request.headers.get("cf-connecting-ip"),
    "cf-ipcountry": request.headers.get("cf-ipcountry"),
    extractedSlug: slug,
    allHeaders: redactHeaders(request.headers),
  });
}
