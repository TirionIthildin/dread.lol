import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAliasSlugTaken, isPrimarySlugTaken } from "@/lib/member-profiles";
import { isReservedProfileSlug, normalizeSlug } from "@/lib/slug";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get("slug")?.trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : "";
  const profileId = searchParams.get("currentProfileId");

  if (!slug) {
    return NextResponse.json({ available: false, error: "Slug is required" });
  }

  if (isReservedProfileSlug(slug)) {
    return NextResponse.json({ available: false, error: "This slug is reserved" });
  }

  const primaryTaken = await isPrimarySlugTaken(slug, profileId ?? undefined);
  const aliasTaken = await isAliasSlugTaken(slug);

  if (primaryTaken) {
    return NextResponse.json({ available: false });
  }

  if (aliasTaken) {
    return NextResponse.json({ available: false });
  }

  const available = !primaryTaken && !aliasTaken;
  return NextResponse.json({ available });
}
