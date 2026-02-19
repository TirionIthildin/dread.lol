import { NextResponse } from "next/server";
import { createPaste } from "@/lib/paste";
import { getSession } from "@/lib/auth/session";
import { getProfileSlugByUserId } from "@/lib/member-profiles";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Log in to create a paste" }, { status: 401 });
    }

    const body = await request.json();
    const content = typeof body.content === "string" ? body.content : String(body.content ?? "");
    const language = typeof body.language === "string" ? body.language : undefined;

    const authorSlug = await getProfileSlugByUserId(session.sub);
    const authorName = session.name ?? session.preferred_username ?? null;

    const result = await createPaste({
      content,
      language,
      userId: session.sub,
      authorSlug,
      authorName,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create paste";
    const status =
      message.includes("Authentication") || message.includes("Log in") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
