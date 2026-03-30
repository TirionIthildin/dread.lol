import { beforeEach, describe, expect, it, vi } from "vitest";

type InMemoryValkey = {
  kv: Map<string, string>;
  sets: Map<string, Set<string>>;
};

const { store, redisMock, resetStore } = vi.hoisted(() => {
  const state: InMemoryValkey = {
    kv: new Map<string, string>(),
    sets: new Map<string, Set<string>>(),
  };

  const delImpl = async (key: string): Promise<number> => {
    let removed = 0;
    if (state.kv.delete(key)) removed++;
    if (state.sets.delete(key)) removed++;
    return removed;
  };

  const redis = {
    smembers: vi.fn(async (key: string): Promise<string[]> => [...(state.sets.get(key) ?? new Set<string>())]),
    sismember: vi.fn(async (key: string, member: string): Promise<number> => ((state.sets.get(key)?.has(member) ?? false) ? 1 : 0)),
    srem: vi.fn(async (key: string, member: string): Promise<number> => {
      const set = state.sets.get(key);
      if (!set) return 0;
      const had = set.delete(member);
      if (set.size === 0) state.sets.delete(key);
      return had ? 1 : 0;
    }),
    get: vi.fn(async (key: string): Promise<string | null> => state.kv.get(key) ?? null),
    del: vi.fn(delImpl),
    scan: vi.fn(async (_cursor: string, _match: string, pattern: string): Promise<[string, string[]]> => {
      const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
      const keys = [...state.kv.keys()].filter((k) => k.startsWith(prefix));
      return ["0", keys];
    }),
  };

  return {
    store: state,
    redisMock: redis,
    resetStore: () => {
      state.kv.clear();
      state.sets.clear();
      Object.values(redis).forEach((fn) => {
        if ("mockClear" in fn && typeof fn.mockClear === "function") fn.mockClear();
      });
    },
  };
});

vi.mock("@/lib/valkey", () => ({
  getValkey: () => redisMock,
}));

function legacySession(sub: string): string {
  return JSON.stringify({ sub, auth_provider: "local" });
}

function v2Session(sub: string, lastSeenAt: number): string {
  return JSON.stringify({
    v: 2,
    user: { sub, auth_provider: "local" },
    meta: {
      createdAt: lastSeenAt - 1000,
      lastSeenAt,
      userAgent: null,
      ip: null,
    },
  });
}

describe("session legacy-index fallback", () => {
  beforeEach(() => {
    resetStore();
    vi.resetModules();
  });

  it("lists legacy sessions not present in user index", async () => {
    const { listSessionsForUser } = await import("@/lib/auth/session");
    store.kv.set("session:indexed", v2Session("u1", 100));
    store.kv.set("session:legacy", legacySession("u1"));
    store.kv.set("session:other", v2Session("u2", 500));
    store.sets.set("user_sessions:u1", new Set(["indexed"]));

    const sessions = await listSessionsForUser("u1");
    const ids = new Set(sessions.map((s) => s.sessionId));
    expect(ids).toEqual(new Set(["indexed", "legacy"]));
  });

  it("revokes a non-indexed legacy session owned by user", async () => {
    const { revokeSessionForUser } = await import("@/lib/auth/session");
    store.kv.set("session:legacy", legacySession("u1"));

    const ok = await revokeSessionForUser("u1", "legacy");
    expect(ok).toBe(true);
    expect(store.kv.has("session:legacy")).toBe(false);
  });

  it("revoke-all removes both indexed and legacy sessions for that user", async () => {
    const { revokeAllSessionsForUser } = await import("@/lib/auth/session");
    store.kv.set("session:indexed", v2Session("u1", 100));
    store.kv.set("session:legacy", legacySession("u1"));
    store.kv.set("session:other", v2Session("u2", 500));
    store.sets.set("user_sessions:u1", new Set(["indexed"]));

    const removed = await revokeAllSessionsForUser("u1");
    expect(removed).toBe(2);
    expect(store.kv.has("session:indexed")).toBe(false);
    expect(store.kv.has("session:legacy")).toBe(false);
    expect(store.kv.has("session:other")).toBe(true);
    expect(store.sets.has("user_sessions:u1")).toBe(false);
  });
});
