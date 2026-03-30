import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import {
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  type TemplateData,
} from "@/lib/marketplace-templates";

type Params = { params: Promise<{ id: string }> };

/** GET: Fetch a single template (public if published, creator or admin if draft). */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const isAdmin = user?.isAdmin ?? false;
  const template = await getTemplateById(id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  const canView = template.status === "published" || template.creatorId === session?.sub || isAdmin;
  if (!canView) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json(template);
}

/** PATCH: Update a template (creator only). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await getOrCreateUser(session);

  const { id } = await params;
  try {
    const body = await request.json();
    const updates: { name?: string; description?: string; previewUrl?: string; data?: TemplateData } = {};
    if (body.name !== undefined) updates.name = String(body.name);
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.previewUrl !== undefined) updates.previewUrl = String(body.previewUrl);
    if (body.data !== undefined) updates.data = body.data as TemplateData;

    const ok = await updateTemplate(id, session.sub, updates);
    if (!ok) {
      return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE: Delete a template (creator only). */
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await getOrCreateUser(session);

  const { id } = await params;
  const ok = await deleteTemplate(id, session.sub);
  if (!ok) {
    return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
