import { describe, it, expect } from "vitest";
import { getClientIp } from "@/lib/rate-limit";

describe("getClientIp", () => {
  it("prefers cf-connecting-ip", () => {
    const req = new Request("https://example.com", {
      headers: {
        "cf-connecting-ip": "1.2.3.4",
        "x-forwarded-for": "5.6.7.8",
      },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "5.6.7.8, 9.10.11.12" },
    });
    expect(getClientIp(req)).toBe("5.6.7.8");
  });

  it("returns null when no headers", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe(null);
  });
});
