import { NextRequest, NextResponse } from "next/server";
import {
  getMonitoringSettings,
  getMonitoringWebhookUrlRaw,
} from "@/lib/monitoring-settings";
import { collectSystemSnapshot, sendMonitoringWebhook } from "@/lib/system-monitoring";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length).trim();
  return token === secret;
}

/**
 * GET: collect metrics and post to Discord when monitoring is enabled.
 * Schedule externally (e.g. Coolify cron) with:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getMonitoringSettings();
  const url = await getMonitoringWebhookUrlRaw();

  if (!settings.enabled || !url) {
    return NextResponse.json({ skipped: true, reason: "monitoring disabled or no webhook" });
  }

  const snapshot = await collectSystemSnapshot();
  const result = await sendMonitoringWebhook(url, snapshot);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, discordStatus: result.status },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, discordStatus: result.status });
}
