import { NextRequest, NextResponse } from "next/server";
import { getPaste, updatePaste, deletePaste } from "@/lib/paste";
import { getSession } from "@/lib/auth/session";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Log in to update a paste" }, { status: 401 });
  }

  const { slug } = await params;
  try {
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content : undefined;
    const language =
      body.language !== undefined
        ? (typeof body.language === "string" ? body.language : null)
        : undefined;

    const ok = await updatePaste(slug, session.sub, { content, language });
    if (!ok) {
      return NextResponse.json({ error: "Paste not found or access denied" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update paste";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Log in to delete a paste" }, { status: 401 });
  }

  const { slug } = await params;
  const ok = await deletePaste(slug, session.sub);
  if (!ok) {
    return NextResponse.json({ error: "Paste not found or access denied" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
