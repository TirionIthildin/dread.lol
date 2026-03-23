import { NextResponse } from "next/server";
import { getBlogPostsForProfile } from "@/lib/blog";
import { getMemberProfileBySlug } from "@/lib/member-profiles";
import { buildBlogRssXml } from "@/lib/rss";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const MAX_POSTS = 50;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memberRow = await getMemberProfileBySlug(slug);
  if (!memberRow) {
    return new NextResponse("Not found", { status: 404 });
  }
  const posts = await getBlogPostsForProfile(memberRow.id, MAX_POSTS);
  const xml = buildBlogRssXml({
    siteUrl: SITE_URL,
    siteName: SITE_NAME,
    profileName: memberRow.name,
    slug: memberRow.slug,
    posts,
  });
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
