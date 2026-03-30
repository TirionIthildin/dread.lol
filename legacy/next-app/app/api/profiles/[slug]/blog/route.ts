import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMemberProfileBySlug } from "@/lib/member-profiles";
import { getBlogPostsForProfile, createBlogPost } from "@/lib/blog";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getBillingSettings } from "@/lib/settings";

type Params = { params: Promise<{ slug: string }> };

/** GET: return blog posts for a profile by slug (public). */
export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const posts = await getBlogPostsForProfile(profile.id);
  return NextResponse.json({ posts });
}

/** POST: create a blog post. Requires profile ownership. */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const { slug } = await params;
    const profile = await getMemberProfileBySlug(slug);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    if (profile.userId !== session.sub) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const [billing, premiumAccess] = await Promise.all([
      getBillingSettings(),
      getPremiumAccess(session.sub),
    ]);
    if (billing.blogPremiumOnly && !premiumAccess.hasAccess) {
      return NextResponse.json({ error: "Microblog requires Premium. Upgrade at /dashboard/premium" }, { status: 403 });
    }
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title : "";
    const content = typeof body.content === "string" ? body.content : "";
    const post = await createBlogPost(profile.id, session.sub, { title, content });
    return NextResponse.json(post);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
