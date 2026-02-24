import { NextResponse } from "next/server";
import { createPaste, listPastesByUserId, countPastesByUserIdThisMonth } from "@/lib/paste";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getBillingSettings } from "@/lib/settings";
import { requireSession } from "@/lib/auth/require-session";
import { getProfileSlugByUserId } from "@/lib/member-profiles";
import { pasteCreateSchema } from "@/lib/api-schemas";
import { rateLimitByUser } from "@/lib/rate-limit";

const PASTE_CREATE_LIMIT = 20;
const PASTE_CREATE_WINDOW = 60;

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  try {
    const pastes = await listPastesByUserId(auth.session.sub);
    return NextResponse.json({ pastes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list pastes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const rateLimitResult = await rateLimitByUser(
    auth.session.sub,
    "paste-create",
    PASTE_CREATE_LIMIT,
    PASTE_CREATE_WINDOW
  );
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  try {
    const [billing, premiumAccess] = await Promise.all([
      getBillingSettings(),
      getPremiumAccess(auth.session.sub),
    ]);
    if (billing.pastePremiumOnly && !premiumAccess.hasAccess) {
      return NextResponse.json(
        { error: "Paste requires Premium. Upgrade at /dashboard/premium to create pastes." },
        { status: 403 }
      );
    }
    if (billing.pasteMaxFreePerMonth > 0 && !premiumAccess.hasAccess) {
      const count = await countPastesByUserIdThisMonth(auth.session.sub);
      if (count >= billing.pasteMaxFreePerMonth) {
        return NextResponse.json(
          { error: `Free accounts are limited to ${billing.pasteMaxFreePerMonth} pastes per month. Upgrade to Premium for unlimited.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const parsed = pasteCreateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { content, language } = parsed.data;

    const authorSlug = await getProfileSlugByUserId(auth.session.sub);
    const authorName = auth.session.name ?? auth.session.preferred_username ?? null;

    const result = await createPaste({
      content,
      language: language ?? undefined,
      userId: auth.session.sub,
      authorSlug,
      authorName,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create paste";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
