import { describe, it, expect, vi, beforeEach } from "vitest";

const getMonitoringSettings = vi.fn();
const getMonitoringWebhookUrlRaw = vi.fn();
const collectSystemSnapshot = vi.fn();
const sendMonitoringWebhook = vi.fn();

vi.mock("@/lib/monitoring-settings", () => ({
  getMonitoringSettings: () => getMonitoringSettings(),
  getMonitoringWebhookUrlRaw: () => getMonitoringWebhookUrlRaw(),
}));

vi.mock("@/lib/system-monitoring", () => ({
  collectSystemSnapshot: () => collectSystemSnapshot(),
  sendMonitoringWebhook: (...args: unknown[]) => sendMonitoringWebhook(...args),
}));

describe("GET /api/cron/monitoring", () => {
  beforeEach(() => {
    vi.resetModules();
    getMonitoringSettings.mockReset();
    getMonitoringWebhookUrlRaw.mockReset();
    collectSystemSnapshot.mockReset();
    sendMonitoringWebhook.mockReset();
    process.env.CRON_SECRET = "test-secret";
  });

  it("returns 401 without Authorization header", async () => {
    const { GET } = await import("@/app/api/cron/monitoring/route");
    const res = await GET(
      new Request("http://localhost/api/cron/monitoring") as Parameters<typeof GET>[0]
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong Bearer token", async () => {
    const { GET } = await import("@/app/api/cron/monitoring/route");
    const res = await GET(
      new Request("http://localhost/api/cron/monitoring", {
        headers: { Authorization: "Bearer wrong" },
      }) as Parameters<typeof GET>[0]
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import("@/app/api/cron/monitoring/route");
    const res = await GET(
      new Request("http://localhost/api/cron/monitoring", {
        headers: { Authorization: "Bearer test-secret" },
      }) as Parameters<typeof GET>[0]
    );
    expect(res.status).toBe(401);
  });

  it("returns skipped when monitoring disabled", async () => {
    getMonitoringSettings.mockResolvedValue({
      enabled: false,
      webhookConfigured: false,
      webhookUrlSuffix: null,
      webhookUrlHint: null,
      cronSecretConfigured: true,
    });
    getMonitoringWebhookUrlRaw.mockResolvedValue(null);

    const { GET } = await import("@/app/api/cron/monitoring/route");
    const res = await GET(
      new Request("http://localhost/api/cron/monitoring", {
        headers: { Authorization: "Bearer test-secret" },
      }) as Parameters<typeof GET>[0]
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ skipped: true });
    expect(sendMonitoringWebhook).not.toHaveBeenCalled();
  });

  it("sends snapshot when enabled and webhook configured", async () => {
    getMonitoringSettings.mockResolvedValue({
      enabled: true,
      webhookConfigured: true,
      webhookUrlSuffix: "abcdef",
      webhookUrlHint: "hint",
      cronSecretConfigured: true,
    });
    getMonitoringWebhookUrlRaw.mockResolvedValue(
      "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH"
    );
    const snap = {
      collectedAt: new Date().toISOString(),
      host: {
        loadavg: [0, 0, 0],
        freememBytes: 1,
        totalmemBytes: 2,
        freememPercent: 50,
        platform: "linux",
        hostname: "h",
      },
      process: { uptimeSec: 1, rssBytes: 1, heapUsedBytes: 1, heapTotalBytes: 1 },
      mongodb: { ok: true },
      valkey: { ok: true },
    };
    collectSystemSnapshot.mockResolvedValue(snap);
    sendMonitoringWebhook.mockResolvedValue({ ok: true, status: 204 });

    const { GET } = await import("@/app/api/cron/monitoring/route");
    const res = await GET(
      new Request("http://localhost/api/cron/monitoring", {
        headers: { Authorization: "Bearer test-secret" },
      }) as Parameters<typeof GET>[0]
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, discordStatus: 204 });
    expect(sendMonitoringWebhook).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH",
      snap
    );
  });
});
