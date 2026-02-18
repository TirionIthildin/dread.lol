import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

const SESSION_COOKIE = "dread_session";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function POST() {
  await destroySession();
  const res = NextResponse.redirect(new URL("/dashboard", BASE_URL));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET() {
  await destroySession();
  const res = NextResponse.redirect(new URL("/dashboard", BASE_URL));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
