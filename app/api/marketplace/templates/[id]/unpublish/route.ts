import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { unpublishTemplate } from "@/lib/marketplace-templates";

type Params = { params: Promise<{ id: string }> };

/** POST: Unpublish a template (creator only). */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!user.approved && !user.isAdmin) {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const { id } = await params;
  const ok = await unpublishTemplate(id, session.sub);
  if (!ok) {
    return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
