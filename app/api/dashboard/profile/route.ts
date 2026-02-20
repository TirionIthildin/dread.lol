import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getProfileSlugByUserId, getMemberProfileBySlug } from "@/lib/member-profiles";

/** GET: Current user's profile (id, slug, name) for use in dashboard. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const slug = await getProfileSlugByUserId(session.sub);
  if (!slug) {
    return NextResponse.json({ profile: null });
  }
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ profile: null });
  }
  return NextResponse.json({
    profile: { id: profile.id, slug: profile.slug, name: profile.name },
  });
}
