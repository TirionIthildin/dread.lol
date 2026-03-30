import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { getOrCreateUser, getMemberProfileById } from "@/lib/member-profiles";
import { applyTemplate } from "@/lib/marketplace-templates";
import { marketplaceApplySchema } from "@/lib/api-schemas";

type Params = { params: Promise<{ id: string }> };

/** POST: Apply template to current user's profile. */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  await getOrCreateUser(auth.session);

  const { id: templateId } = await params;
  let body: { profileId?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = marketplaceApplySchema.safeParse(body);
  let profileId = parsed.success ? parsed.data.profileId : undefined;

  if (!profileId) {
    const { getProfileSlugByUserId, getMemberProfileBySlug } = await import("@/lib/member-profiles");
    const slug = await getProfileSlugByUserId(auth.session.sub);
    if (!slug) {
      return NextResponse.json({ error: "No profile found. Create one in the dashboard first." }, { status: 404 });
    }
    const p = await getMemberProfileBySlug(slug);
    if (!p) {
      return NextResponse.json({ error: "No profile found" }, { status: 404 });
    }
    profileId = p.id;
  }

  const profile = await getMemberProfileById(profileId);
  if (!profile || profile.userId !== auth.session.sub) {
    return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 });
  }

  const result = await applyTemplate(templateId, profileId, auth.session.sub);
  if (result.error) {
    const status = result.error.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, slug: profile.slug });
}
