import { NextResponse } from "next/server";
import { createPaste, listPastesByUserId, countPastesByUserIdThisMonth } from "@/lib/paste";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getBillingSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth/session";
import { getProfileSlugByUserId } from "@/lib/member-profiles";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Log in to view pastes" }, { status: 401 });
    }
    const pastes = await listPastesByUserId(session.sub);
    return NextResponse.json({ pastes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list pastes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Log in to create a paste" }, { status: 401 });
    }

    const [billing, premiumAccess] = await Promise.all([
      getBillingSettings(),
      getPremiumAccess(session.sub),
    ]);
    if (billing.pastePremiumOnly && !premiumAccess.hasAccess) {
      return NextResponse.json(
        { error: "Paste requires Premium. Upgrade at /dashboard/shop to create pastes." },
        { status: 403 }
      );
    }
    if (billing.pasteMaxFreePerMonth > 0 && !premiumAccess.hasAccess) {
      const count = await countPastesByUserIdThisMonth(session.sub);
      if (count >= billing.pasteMaxFreePerMonth) {
        return NextResponse.json(
          { error: `Free accounts are limited to ${billing.pasteMaxFreePerMonth} pastes per month. Upgrade to Premium for unlimited.` },
          { status: 403 }
        );
      }
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
