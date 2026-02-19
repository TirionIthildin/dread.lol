import { NextRequest, NextResponse } from "next/server";
import { getMemberProfileBySlug, getGalleryForProfile } from "@/lib/member-profiles";

type Params = { params: Promise<{ slug: string }> };

/** GET: return gallery items for a profile by slug (public). */
export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const gallery = await getGalleryForProfile(profile.id);
  return NextResponse.json({ gallery });
}
