import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/[locale]/dashboard/actions";
import {
  getMonitoringSettings,
  setMonitoringEnabled,
  setMonitoringWebhookUrl,
} from "@/lib/monitoring-settings";
import { isValidDiscordWebhookUrl } from "@/lib/system-monitoring";

/** GET: monitoring configuration for admin (no full webhook URL). */
export async function GET() {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const monitoring = await getMonitoringSettings();
  return NextResponse.json({ monitoring });
}

export async function PATCH(request: NextRequest) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  let body: {
    monitoring?: {
      enabled?: boolean;
      discordWebhookUrl?: string;
    };
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const m = body.monitoring;
  if (!m) {
    return NextResponse.json({ error: "Missing monitoring" }, { status: 400 });
  }

  if (typeof m.enabled === "boolean") {
    await setMonitoringEnabled(m.enabled);
  }

  if (m.discordWebhookUrl !== undefined) {
    const raw = typeof m.discordWebhookUrl === "string" ? m.discordWebhookUrl.trim() : "";
    if (raw === "") {
      await setMonitoringWebhookUrl("");
    } else if (!isValidDiscordWebhookUrl(raw)) {
      return NextResponse.json(
        { error: "Invalid Discord webhook URL (expected https://discord.com/api/webhooks/...)" },
        { status: 400 }
      );
    } else {
      await setMonitoringWebhookUrl(raw);
    }
  }

  const monitoring = await getMonitoringSettings();
  return NextResponse.json({ monitoring });
}
