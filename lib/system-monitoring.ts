/**
 * Host/process metrics and dependency checks for Discord monitoring alerts.
 */
import os from "os";
import { getDb, getDbName } from "@/lib/db";
import { withValkey } from "@/lib/valkey";

export type DependencyCheck = {
  ok: boolean;
  latencyMs?: number;
  error?: string;
};

export type SystemSnapshot = {
  collectedAt: string;
  host: {
    loadavg: number[];
    freememBytes: number;
    totalmemBytes: number;
    freememPercent: number;
    platform: string;
    hostname: string;
  };
  process: {
    uptimeSec: number;
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
  };
  mongodb: DependencyCheck;
  valkey: DependencyCheck;
};

const DISCORD_WEBHOOK_HOSTS = new Set([
  "discord.com",
  "discordapp.com",
  "canary.discord.com",
  "ptb.discord.com",
]);

/**
 * Accept only HTTPS Discord webhook execute URLs.
 */
export function isValidDiscordWebhookUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (!DISCORD_WEBHOOK_HOSTS.has(url.hostname)) return false;
  const pathParts = url.pathname.split("/").filter(Boolean);
  if (pathParts.length < 3) return false;
  if (pathParts[0] !== "api" || pathParts[1] !== "webhooks") return false;
  const id = pathParts[2];
  const token = pathParts[3];
  if (!/^\d+$/.test(id)) return false;
  if (!token || token.length < 10) return false;
  return true;
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "?";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export async function collectSystemSnapshot(): Promise<SystemSnapshot> {
  const collectedAt = new Date().toISOString();
  const totalmem = os.totalmem();
  const freemem = os.freemem();

  let mongodb: DependencyCheck = { ok: false };
  const mongoStart = Date.now();
  try {
    const client = await getDb();
    const dbName = await getDbName();
    await client.db(dbName).command({ ping: 1 });
    mongodb = { ok: true, latencyMs: Date.now() - mongoStart };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    mongodb = { ok: false, error: msg.slice(0, 200) };
  }

  let valkey: DependencyCheck = { ok: false };
  const valStart = Date.now();
  try {
    await withValkey(async (redis) => {
      await redis.ping();
    });
    valkey = { ok: true, latencyMs: Date.now() - valStart };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    valkey = { ok: false, error: msg.slice(0, 200) };
  }

  const mem = process.memoryUsage();
  return {
    collectedAt,
    host: {
      loadavg: os.loadavg(),
      freememBytes: freemem,
      totalmemBytes: totalmem,
      freememPercent: totalmem > 0 ? Math.round((freemem / totalmem) * 1000) / 10 : 0,
      platform: platformLabel(),
      hostname: os.hostname(),
    },
    process: {
      uptimeSec: Math.floor(process.uptime()),
      rssBytes: mem.rss,
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
    },
    mongodb,
    valkey,
  };
}

function platformLabel(): string {
  const t = `${os.type()} ${os.release()}`;
  return t.length > 64 ? t.slice(0, 61) + "..." : t;
}

export type SendMonitoringResult =
  | { ok: true; status: number }
  | { ok: false; status?: number; error: string };

/**
 * POST snapshot to a Discord webhook (embed).
 */
export async function sendMonitoringWebhook(
  webhookUrl: string,
  snapshot: SystemSnapshot
): Promise<SendMonitoringResult> {
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    return { ok: false, error: "Invalid webhook URL" };
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    "Dread.lol";

  const allOk = snapshot.mongodb.ok && snapshot.valkey.ok;
  const color = allOk ? 0x22_c5_5e : 0xef_44_44;

  const title = `${allOk ? "OK" : "Issues"} — ${site}`;
  const descriptionLines = [
    `**Host** \`${snapshot.host.hostname}\` · ${snapshot.host.platform}`,
    `**Load** ${snapshot.host.loadavg.map((n) => n.toFixed(2)).join(", ")}`,
    `**Memory** ${formatBytes(snapshot.host.freememBytes)} free / ${formatBytes(snapshot.host.totalmemBytes)} (${snapshot.host.freememPercent}%)`,
    `**Node** ${formatBytes(snapshot.process.rssBytes)} RSS · heap ${formatBytes(snapshot.process.heapUsedBytes)} / ${formatBytes(snapshot.process.heapTotalBytes)} · uptime ${formatDuration(snapshot.process.uptimeSec)}`,
    `**MongoDB** ${formatDep(snapshot.mongodb)}`,
    `**Valkey** ${formatDep(snapshot.valkey)}`,
  ];

  const body = {
    embeds: [
      {
        title,
        description: descriptionLines.join("\n"),
        color,
        timestamp: snapshot.collectedAt,
        footer: { text: "System monitoring" },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = text ? text.slice(0, 200) : `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: err };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.slice(0, 200) };
  }
}

function formatDep(d: DependencyCheck): string {
  if (d.ok) {
    return `ok${d.latencyMs !== undefined ? ` (${d.latencyMs}ms)` : ""}`;
  }
  return `fail${d.error ? `: ${d.error}` : ""}`;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const m2 = m % 60;
  return `${h}h ${m2}m`;
}
