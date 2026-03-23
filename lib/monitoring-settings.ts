/**
 * Admin-configurable Discord system monitoring (MongoDB settings keys).
 */
import { getSetting, setSetting } from "@/lib/settings";

const KEY_ENABLED = "monitoring.enabled";
const KEY_WEBHOOK_URL = "monitoring.discordWebhookUrl";

export interface MonitoringSettings {
  enabled: boolean;
  /** True when a non-empty webhook URL is stored. */
  webhookConfigured: boolean;
  /** Last segment of the webhook path for display only (never the full URL). */
  webhookUrlSuffix: string | null;
  /** Masked hint like Discord webhook hints — not the full URL. */
  webhookUrlHint: string | null;
  /** Whether CRON_SECRET is set in the server environment (for admin guidance). */
  cronSecretConfigured: boolean;
}

function parseWebhookSuffix(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const parts = u.pathname.split("/").filter(Boolean);
    // .../webhooks/{id}/{token}
    const token = parts[parts.length - 1];
    if (token && token.length > 6) {
      return token.slice(-6);
    }
    return token ?? null;
  } catch {
    return null;
  }
}

export function getWebhookUrlHint(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string" || !url.trim()) return null;
  const suffix = parseWebhookSuffix(url);
  if (!suffix) return "•••• (configured)";
  return `https://discord.com/api/webhooks/••••••••/${suffix}`;
}

/**
 * Load monitoring settings for admin API responses (no full webhook URL).
 */
export async function getMonitoringSettings(): Promise<MonitoringSettings> {
  const enabledRaw = await getSetting<boolean>(KEY_ENABLED);
  const urlRaw = await getSetting<string>(KEY_WEBHOOK_URL);

  const enabled =
    enabledRaw !== undefined && enabledRaw !== null ? Boolean(enabledRaw) : false;
  const url = typeof urlRaw === "string" ? urlRaw.trim() : "";
  const webhookConfigured = url.length > 0;

  const webhookUrlSuffix = webhookConfigured ? parseWebhookSuffix(url) : null;
  const webhookUrlHint = webhookConfigured ? getWebhookUrlHint(url) : null;

  return {
    enabled,
    webhookConfigured,
    webhookUrlSuffix,
    webhookUrlHint,
    cronSecretConfigured: !!process.env.CRON_SECRET?.trim(),
  };
}

export async function setMonitoringEnabled(enabled: boolean, updatedBy?: string): Promise<void> {
  await setSetting(KEY_ENABLED, enabled, updatedBy);
}

export async function setMonitoringWebhookUrl(url: string, updatedBy?: string): Promise<void> {
  const trimmed = url.trim();
  await setSetting(KEY_WEBHOOK_URL, trimmed, updatedBy);
}

/** Internal: full URL for server-side send only. */
export async function getMonitoringWebhookUrlRaw(): Promise<string | null> {
  const urlRaw = await getSetting<string>(KEY_WEBHOOK_URL);
  const url = typeof urlRaw === "string" ? urlRaw.trim() : "";
  return url.length > 0 ? url : null;
}
