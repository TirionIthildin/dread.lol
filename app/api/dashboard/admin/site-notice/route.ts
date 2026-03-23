import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/dashboard/actions";
import {
  applySiteNoticePatch,
  getSiteNoticeSettings,
} from "@/lib/site-notice-settings";
import { validateSiteNoticePatch } from "@/lib/site-notice-settings-shared";

/** GET: site notice configuration for admin. */
export async function GET() {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const siteNotice = await getSiteNoticeSettings();
  return NextResponse.json({ siteNotice });
}

export async function PATCH(request: NextRequest) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateSiteNoticePatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await applySiteNoticePatch(parsed.patch);

  revalidatePath("/");
  revalidatePath("/dashboard", "layout");

  const siteNotice = await getSiteNoticeSettings();
  return NextResponse.json({ siteNotice });
}
