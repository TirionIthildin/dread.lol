import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMemberProfileBySlug } from "@/lib/member-profiles";

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "";
}

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

  const existing = await getMemberProfileBySlug(slug);
  const available = !existing || (profileId != null && existing.id === profileId);
  return NextResponse.json({ available });
}
