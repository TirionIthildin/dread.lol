import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { adminUnpublishTemplate } from "@/lib/marketplace-templates";

type Params = { params: Promise<{ id: string }> };

/** POST: Unpublish template. Admin only. */
export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser(session);
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const ok = await adminUnpublishTemplate(id);
  if (!ok) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
