import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { publishTemplate } from "@/lib/marketplace-templates";

type Params = { params: Promise<{ id: string }> };

/** POST: Publish a template (creator only). */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await getOrCreateUser(session);

  const { id } = await params;
  const ok = await publishTemplate(id, session.sub);
  if (!ok) {
    return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
