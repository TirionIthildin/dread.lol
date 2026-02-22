import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMemberProfileBySlug } from "@/lib/member-profiles";
import { updateBlogPost, deleteBlogPost } from "@/lib/blog";

type Params = { params: Promise<{ slug: string; postId: string }> };

/** PATCH: update a blog post. Requires profile ownership. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const { slug, postId } = await params;
    const profile = await getMemberProfileBySlug(slug);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    if (profile.userId !== session.sub) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title : undefined;
    const content = typeof body.content === "string" ? body.content : undefined;
    const post = await updateBlogPost(postId, session.sub, { title, content });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** DELETE: delete a blog post. Requires profile ownership. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const { slug, postId } = await params;
    const profile = await getMemberProfileBySlug(slug);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    if (profile.userId !== session.sub) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const ok = await deleteBlogPost(postId, session.sub);
    if (!ok) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
