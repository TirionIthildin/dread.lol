/**
 * Debug endpoint for subdomain routing.
 * Admin-only: visit username.dread.lol/api/debug/headers when signed in as admin.
 */
import { NextResponse } from "next/server";
import { getProfileSlugFromHost } from "@/lib/request";
import { requireAdmin } from "@/app/dashboard/actions";

export async function GET(request: Request) {
  const err = await requireAdmin();
  if (err) return NextResponse.json({ error: err }, { status: 401 });
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

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
    allHeaders: headers,
  });
}
