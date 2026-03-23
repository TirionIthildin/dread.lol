import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@polar-sh/nextjs", () => ({
  Webhooks: vi.fn(() => vi.fn()),
}));

describe("Polar webhook route", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.POLAR_WEBHOOK_SECRET;
  });

  it("returns 503 when POLAR_WEBHOOK_SECRET is not set", async () => {
    const { POST } = await import("@/app/api/webhooks/polar/route");
    const req = new Request("http://localhost/api/webhooks/polar", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req as Parameters<typeof POST>[0]);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({ error: "Webhook not configured" });
  });
});
