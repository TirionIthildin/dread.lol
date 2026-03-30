import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import {
  addTemplateFavorite,
  removeTemplateFavorite,
  getFavoriteTemplateIds,
} from "@/lib/template-favorites";
import { getTemplateById } from "@/lib/marketplace-templates";
import { marketplaceFavoriteBodySchema } from "@/lib/api-schemas";

/** GET: List user's favorited templates. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await getOrCreateUser(session);

  const ids = await getFavoriteTemplateIds(session.sub);
  if (ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const items = [];
  for (const id of ids) {
    const t = await getTemplateById(id);
    if (t && t.status === "published") {
      items.push(t);
    }
  }
  return NextResponse.json({ items });
}

/** POST: Add favorite. Body: { templateId: string } */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await getOrCreateUser(session);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = marketplaceFavoriteBodySchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const templateId = parsed.data.templateId;

  const template = await getTemplateById(templateId);
  if (!template || template.status !== "published") {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const result = await addTemplateFavorite(session.sub, templateId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

/** DELETE: Remove favorite. Body: { templateId: string } */
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = marketplaceFavoriteBodySchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const templateId = parsed.data.templateId;

  await removeTemplateFavorite(session.sub, templateId);
  return NextResponse.json({ ok: true });
}
