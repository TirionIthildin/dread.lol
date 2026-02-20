import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { getCookieDomain } from "@/lib/site";

const SESSION_COOKIE = "dread_session";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getLogoutCookieOptions() {
  const opts: { path: string; maxAge: number; domain?: string } = { path: "/", maxAge: 0 };
  const domain = getCookieDomain();
  if (domain) opts.domain = domain;
  return opts;
}

export async function POST() {
  await destroySession();
  const res = NextResponse.redirect(new URL("/dashboard", BASE_URL));
  res.cookies.set(SESSION_COOKIE, "", getLogoutCookieOptions());
  return res;
}

export async function GET() {
  await destroySession();
  const res = NextResponse.redirect(new URL("/dashboard", BASE_URL));
  res.cookies.set(SESSION_COOKIE, "", getLogoutCookieOptions());
  return res;
}
