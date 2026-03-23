import { NextRequest, NextResponse } from "next/server";
import { redirectAuthToCanonicalOrigin } from "@/lib/auth/subdomain-canonical";
import { destroySession, getSessionCookieClearOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getCanonicalOrigin } from "@/lib/site";

export async function POST(request: NextRequest) {
  const subdomainRedirect = redirectAuthToCanonicalOrigin(request);
  if (subdomainRedirect) return subdomainRedirect;

  await destroySession();
  const res = NextResponse.redirect(new URL("/dashboard", getCanonicalOrigin()));
  res.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
  return res;
}

export async function GET(request: NextRequest) {
  const subdomainRedirect = redirectAuthToCanonicalOrigin(request);
  if (subdomainRedirect) return subdomainRedirect;

  await destroySession();
  const res = NextResponse.redirect(new URL("/dashboard", getCanonicalOrigin()));
  res.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
  return res;
}
