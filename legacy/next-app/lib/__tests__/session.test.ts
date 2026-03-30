import { describe, expect, it } from "vitest";
import { parseStoredSession, type SessionUser } from "@/lib/auth/session";

describe("parseStoredSession", () => {
  it("parses v2 wrapped session", () => {
    const user: SessionUser = { sub: "local:abc", auth_provider: "local" };
    const raw = JSON.stringify({
      v: 2,
      user,
      meta: {
        createdAt: 1000,
        lastSeenAt: 2000,
        userAgent: "TestUA",
        ip: "1.2.3.4",
      },
    });
    const p = parseStoredSession(raw);
    expect(p?.user.sub).toBe("local:abc");
    expect(p?.meta.ip).toBe("1.2.3.4");
    expect(p?.meta.userAgent).toBe("TestUA");
  });

  it("parses legacy flat SessionUser JSON", () => {
    const user: SessionUser = { sub: "123456789", auth_provider: "discord" };
    const raw = JSON.stringify(user);
    const p = parseStoredSession(raw);
    expect(p?.user.sub).toBe("123456789");
    expect(p?.meta.userAgent).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseStoredSession("not json")).toBeNull();
  });
});
