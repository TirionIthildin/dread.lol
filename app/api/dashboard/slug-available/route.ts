import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMemberProfileBySlug, getMemberProfileById } from "@/lib/member-profiles";
import { normalizeSlug } from "@/lib/slug";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get("slug")?.trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : "";
  const currentProfileId = searchParams.get("currentProfileId");
  const profileId = currentProfileId ? parseInt(currentProfileId, 10) : null;

  if (!slug) {
    return NextResponse.json({ available: false, error: "Slug is required" });
  }

  let ownsCurrentProfile = false;
  if (profileId != null && !Number.isNaN(profileId)) {
    const profile = await getMemberProfileById(profileId);
    ownsCurrentProfile = profile?.userId === session.sub;
  }

  const existing = await getMemberProfileBySlug(slug);
  const available = !existing || (ownsCurrentProfile && existing.id === profileId);
  return NextResponse.json({ available });
}
