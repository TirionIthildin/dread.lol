/**
 * Debug endpoint for subdomain routing.
 * Visit username.dread.lol/api/debug/headers to see what headers your app receives.
 * Remove or protect this route in production.
 */
import { NextResponse } from "next/server";
import { getProfileSlugFromHost } from "@/lib/request";

export async function GET(request: Request) {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const slug = getProfileSlugFromHost(request.headers);

  return NextResponse.json({
    host: request.headers.get("host"),
    "x-forwarded-host": request.headers.get("x-forwarded-host"),
    "x-real-host": request.headers.get("x-real-host"),
    forwarded: request.headers.get("forwarded"),
    extractedSlug: slug,
    allHeaders: headers,
  });
}
