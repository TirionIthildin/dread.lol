import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/app/[locale]/dashboard/actions";
import { sendAdminTestEmail } from "@/lib/email/resend";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  to: z.string().trim().email().max(320),
});

/**
 * POST: Send a test email via Resend (admin only, rate limited).
 */
export async function POST(request: NextRequest) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  const ip = getClientIp(request) ?? "unknown";
  const rl = await rateLimit(`ratelimit:admin:resend:test:${ip}`, 8, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", retryAfter: rl.resetIn },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }

  const result = await sendAdminTestEmail(parsed.data.to);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
