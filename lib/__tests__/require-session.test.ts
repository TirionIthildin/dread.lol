import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const getSession = vi.fn();
const getOrCreateUser = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getSession: (...args: unknown[]) => getSession(...args),
}));

vi.mock("@/lib/member-profiles", () => ({
  getOrCreateUser: (...args: unknown[]) => getOrCreateUser(...args),
}));

describe("requireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    const { requireSession } = await import("@/lib/auth/require-session");
    getSession.mockResolvedValueOnce(null);
    const result = await requireSession();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response).toBeInstanceOf(NextResponse);
      expect(result.response.status).toBe(401);
    }
  });

  it("returns session when present", async () => {
    const { requireSession } = await import("@/lib/auth/require-session");
    const session = { sub: "u1", name: "Test" };
    getSession.mockResolvedValueOnce(session);
    const result = await requireSession();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.session).toEqual(session);
  });
});

describe("requireAdminSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    const { requireAdminSession } = await import("@/lib/auth/require-session");
    getSession.mockResolvedValueOnce(null);
    const result = await requireAdminSession();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    const { requireAdminSession } = await import("@/lib/auth/require-session");
    getSession.mockResolvedValueOnce({ sub: "u1" });
    getOrCreateUser.mockResolvedValueOnce({
      id: "u1",
      approved: true,
      isAdmin: false,
    });
    const result = await requireAdminSession();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("returns session and user when admin", async () => {
    const { requireAdminSession } = await import("@/lib/auth/require-session");
    const session = { sub: "admin1" };
    const user = { id: "admin1", approved: true, isAdmin: true };
    getSession.mockResolvedValueOnce(session);
    getOrCreateUser.mockResolvedValueOnce(user);
    const result = await requireAdminSession();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session).toEqual(session);
      expect(result.user).toEqual(user);
    }
  });
});
