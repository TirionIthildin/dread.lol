import { NextRequest, NextResponse } from "next/server";
import { getPaste } from "@/lib/paste";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const paste = await getPaste(slug);
  if (!paste) {
    return NextResponse.json({ error: "Paste not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("raw") === "1" || url.searchParams.get("raw") === "true") {
    return new NextResponse(paste.content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return NextResponse.json({
    content: paste.content,
    language: paste.language,
    createdAt: paste.createdAt.toISOString(),
  });
}
