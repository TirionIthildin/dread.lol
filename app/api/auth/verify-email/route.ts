import { NextRequest, NextResponse } from "next/server";
import { consumePendingRegistration } from "@/lib/auth/auth-valkey";
import { findUserById } from "@/lib/auth/local-account";
import { createSession, getSessionCookieConfig } from "@/lib/auth/session";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/db/schema";
import { SITE_URL } from "@/lib/site";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const base = SITE_URL.replace(/\/$/, "");

  if (!token) {
    return NextResponse.redirect(new URL("/?error=verify_missing", base));
  }

  const pending = await consumePendingRegistration(token);
  if (!pending) {
    return NextResponse.redirect(new URL("/?error=verify_invalid", base));
  }

  const existing = await findUserById(pending.userId);
  if (existing) {
    return NextResponse.redirect(new URL("/dashboard?welcome=1", base));
  }

  const now = new Date();
  const doc: UserDoc = {
    _id: pending.userId,
    authProvider: "local",
    username: pending.username,
    displayName: pending.username,
    email: pending.email,
    emailVerifiedAt: now,
    srpSalt: pending.srpSalt,
    srpVerifier: pending.srpVerifier,
    approved: true,
    isAdmin: false,
    verified: false,
    staff: false,
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  const client = await getDb();
  const dbName = await getDbName();
  await client.db(dbName).collection(COLLECTIONS.users).insertOne(doc as never);

  const sessionValue = await createSession({
    sub: pending.userId,
    auth_provider: "local",
    name: pending.username,
    preferred_username: pending.username,
    email: pending.email,
    picture: null,
  });
  const config = getSessionCookieConfig(sessionValue);
  const res = NextResponse.redirect(new URL("/dashboard?welcome=1", base));
  const { name, value, ...opts } = config;
  res.cookies.set(name, value, opts);
  return res;
}
