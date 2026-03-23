import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import { getMonitoringSettings, getMonitoringWebhookUrlRaw } from "@/lib/monitoring-settings";
import { collectSystemSnapshot, sendMonitoringWebhook } from "@/lib/system-monitoring";

/** POST: send one monitoring snapshot to Discord (admin test). */
export async function POST() {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }

  const settings = await getMonitoringSettings();
  const url = await getMonitoringWebhookUrlRaw();

  if (!settings.enabled) {
    return NextResponse.json({ error: "Monitoring is disabled. Enable it first." }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: "Set a Discord webhook URL first." }, { status: 400 });
  }

  const snapshot = await collectSystemSnapshot();
  const result = await sendMonitoringWebhook(url, snapshot);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, discordStatus: result.status },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, discordStatus: result.status });
}
