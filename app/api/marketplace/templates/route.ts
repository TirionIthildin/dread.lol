import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { marketplaceTemplateCreateSchema } from "@/lib/api-schemas";
import { getOrCreateUser } from "@/lib/member-profiles";
import {
  listPublishedTemplates,
  createTemplate,
  getTemplatesByCreator,
  buildTemplateDataFromProfile,
  type TemplateData,
} from "@/lib/marketplace-templates";
import { getMemberProfileById } from "@/lib/member-profiles";

/** GET: List published templates (public), creator's templates (mine=1), or all templates (admin=1). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "1";
  const admin = searchParams.get("admin") === "1";

  if (mine) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await getOrCreateUser(session);
    const items = await getTemplatesByCreator(session.sub);
    return NextResponse.json({ items });
  }

  if (admin) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getOrCreateUser(session);
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const { listAllTemplatesForAdmin } = await import("@/lib/marketplace-templates");
    const items = await listAllTemplatesForAdmin();
    return NextResponse.json({ items });
  }

  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10) || 0);
  const sort = searchParams.get("sort") === "recent" ? "recent" : "applied";
  const q = searchParams.get("q")?.trim() || undefined;
  const { items, total } = await listPublishedTemplates({ limit, skip, sort, q });
  return NextResponse.json({ items, total });
}

/** POST: Create a new template (from current profile or raw data). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await getOrCreateUser(session);

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = marketplaceTemplateCreateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { fromProfileId, name: rawName, description: rawDesc, previewUrl: rawPreviewUrl, data: rawData } = parsed.data;
    const fromProfile = fromProfileId?.trim();

    let data: { name: string; description?: string; previewUrl?: string; data: TemplateData };

    if (fromProfile) {
      const profile = await getMemberProfileById(fromProfile);
      if (!profile || profile.userId !== session.sub) {
        return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 });
      }
      const templateData = await buildTemplateDataFromProfile(fromProfile, profile);
      const name = rawName?.trim() || `${profile.name}'s template`;
      const description = rawDesc?.trim();
      data = { name, description, data: templateData };
    } else {
      const name = rawName?.trim();
      const description = rawDesc?.trim();
      const previewUrl = rawPreviewUrl?.trim();
      const templateData = (rawData as TemplateData) ?? {};
      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      data = { name, description, previewUrl, data: templateData };
    }

    const result = await createTemplate(session.sub, data);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ id: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
