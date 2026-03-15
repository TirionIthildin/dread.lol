import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  link: null as
    | {
        _id: ObjectId;
        token: string;
        badgeId: ObjectId;
        createdBy: string;
        usedAt: Date | null;
        usedBy: string | null;
        maxRedemptions?: number | null;
        redemptionCount?: number;
        expiresAt: Date | null;
      }
    | null,
  sourceBadge: null as
    | {
        _id: ObjectId;
        label: string;
        description: string | null;
        color: string | null;
        badgeType: "label" | "image" | "icon";
        imageUrl: string | null;
        iconName: string | null;
      }
    | null,
  events: [] as Array<{ linkId: ObjectId; token: string; redeemedBy: string; redeemedAt: Date }>,
  createUserCreatedBadgeMock: vi.fn(
    async (): Promise<{ id: string; label: string } | null> => ({ id: "new-badge", label: "Alpha Badge" })
  ),
}));

vi.mock("@/lib/user-created-badge", () => ({
  createUserCreatedBadge: testState.createUserCreatedBadgeMock,
}));

vi.mock("@/lib/db", () => {
  const COLLECTIONS = {
    badgeRedemptionLinks: "badge_redemption_links",
    badgeRedemptionEvents: "badge_redemption_events",
    userCreatedBadges: "user_created_badges",
  } as const;

  return {
    COLLECTIONS,
    getDbName: async () => "test",
    getDb: async () => ({
      db: () => ({
        collection: (name: string) => {
          if (name === COLLECTIONS.badgeRedemptionLinks) {
            return {
              findOne: async (query: { token?: string; _id?: ObjectId }) => {
                const link = testState.link;
                if (!link) return null;
                if (query.token && link.token === query.token) return { ...link };
                if (query._id && link._id.equals(query._id)) return { ...link };
                return null;
              },
              findOneAndUpdate: async (
                filter: { _id: ObjectId; redemptionCount?: { $lt?: number }; usedAt?: null },
                update: { $inc?: { redemptionCount?: number }; $set?: { usedAt?: Date | null; usedBy?: string | null } }
              ) => {
                const link = testState.link;
                if (!link || !link._id.equals(filter._id)) return null;
                if (filter.usedAt === null && link.usedAt !== null) return null;
                const lt = filter.redemptionCount?.$lt;
                if (typeof lt === "number") {
                  if (typeof link.redemptionCount !== "number" || !(link.redemptionCount < lt)) return null;
                }
                if (Object.prototype.hasOwnProperty.call(update.$set ?? {}, "usedAt")) {
                  link.usedAt = update.$set?.usedAt ?? null;
                }
                if (Object.prototype.hasOwnProperty.call(update.$set ?? {}, "usedBy")) {
                  link.usedBy = update.$set?.usedBy ?? null;
                }
                if (typeof update.$inc?.redemptionCount === "number") {
                  link.redemptionCount = (link.redemptionCount ?? 0) + update.$inc.redemptionCount;
                }
                return { ...link };
              },
              updateOne: async (
                filter: { _id: ObjectId; redemptionCount?: { $exists?: boolean; $gt?: number }; usedBy?: string | null },
                update: { $set?: { redemptionCount?: number; usedAt?: Date | null; usedBy?: string | null }; $inc?: { redemptionCount?: number } }
              ) => {
                const link = testState.link;
                if (!link || !link._id.equals(filter._id)) return { matchedCount: 0, modifiedCount: 0 };
                if (Object.prototype.hasOwnProperty.call(filter, "usedBy")) {
                  if (link.usedBy !== filter.usedBy) return { matchedCount: 0, modifiedCount: 0 };
                }
                if (typeof filter.redemptionCount?.$exists === "boolean") {
                  const exists = typeof link.redemptionCount === "number";
                  if (exists !== filter.redemptionCount.$exists) return { matchedCount: 0, modifiedCount: 0 };
                }
                if (typeof filter.redemptionCount?.$gt === "number") {
                  if (typeof link.redemptionCount !== "number" || !(link.redemptionCount > filter.redemptionCount.$gt)) {
                    return { matchedCount: 0, modifiedCount: 0 };
                  }
                }
                if (typeof update.$set?.redemptionCount === "number") {
                  link.redemptionCount = update.$set.redemptionCount;
                }
                if (Object.prototype.hasOwnProperty.call(update.$set ?? {}, "usedAt")) {
                  link.usedAt = update.$set?.usedAt ?? null;
                }
                if (Object.prototype.hasOwnProperty.call(update.$set ?? {}, "usedBy")) {
                  link.usedBy = update.$set?.usedBy ?? null;
                }
                if (typeof update.$inc?.redemptionCount === "number") {
                  link.redemptionCount = (link.redemptionCount ?? 0) + update.$inc.redemptionCount;
                }
                return { matchedCount: 1, modifiedCount: 1 };
              },
            };
          }

          if (name === COLLECTIONS.badgeRedemptionEvents) {
            return {
              findOne: async (query: { token?: string; redeemedBy?: string }) =>
                testState.events.find(
                  (e) =>
                    (query.token == null || e.token === query.token) &&
                    (query.redeemedBy == null || e.redeemedBy === query.redeemedBy)
                ) ?? null,
              countDocuments: async (query: { token?: string; linkId?: ObjectId }) =>
                testState.events.filter(
                  (e) =>
                    (query.token == null || e.token === query.token) &&
                    (query.linkId == null || e.linkId.equals(query.linkId))
                ).length,
              insertOne: async (doc: { linkId: ObjectId; token: string; redeemedBy: string; redeemedAt: Date }) => {
                const duplicate = testState.events.some(
                  (e) => e.linkId.equals(doc.linkId) && e.redeemedBy === doc.redeemedBy
                );
                if (duplicate) {
                  const err = new Error("duplicate key");
                  (err as Error & { code?: number }).code = 11000;
                  throw err;
                }
                testState.events.push(doc);
                return { acknowledged: true };
              },
              deleteOne: async (query: { linkId: ObjectId; redeemedBy: string }) => {
                const idx = testState.events.findIndex(
                  (e) => e.linkId.equals(query.linkId) && e.redeemedBy === query.redeemedBy
                );
                if (idx === -1) return { deletedCount: 0 };
                testState.events.splice(idx, 1);
                return { deletedCount: 1 };
              },
            };
          }

          if (name === COLLECTIONS.userCreatedBadges) {
            return {
              findOne: async (query: { _id: ObjectId }) => {
                if (testState.sourceBadge && testState.sourceBadge._id.equals(query._id)) {
                  return { ...testState.sourceBadge };
                }
                return null;
              },
            };
          }

          return {};
        },
      }),
    }),
  };
});

describe("redeemLink", () => {
  beforeEach(() => {
    const badgeId = new ObjectId();
    testState.link = {
      _id: new ObjectId(),
      token: "badge-token",
      badgeId,
      createdBy: "creator-1",
      usedAt: null,
      usedBy: null,
      maxRedemptions: 1,
      redemptionCount: undefined,
      expiresAt: null,
    };
    testState.sourceBadge = {
      _id: badgeId,
      label: "Alpha Badge",
      description: null,
      color: "cyan",
      badgeType: "label",
      imageUrl: null,
      iconName: null,
    };
    testState.events = [];
    testState.createUserCreatedBadgeMock.mockReset();
    testState.createUserCreatedBadgeMock.mockResolvedValue({ id: "new-badge", label: "Alpha Badge" });
  });

  it("prevents over-redemption for capped links during concurrency", async () => {
    const { redeemLink } = await import("@/lib/badge-redemption");

    const [a, b] = await Promise.all([
      redeemLink("badge-token", "user-a"),
      redeemLink("badge-token", "user-b"),
    ]);

    const successes = [a, b].filter((r) => "success" in r).length;
    const failures = [a, b].filter((r) => "error" in r).length;
    expect(successes).toBe(1);
    expect(failures).toBe(1);
    expect(testState.events).toHaveLength(1);
    expect(testState.link?.redemptionCount).toBe(1);
  });

  it("releases reserved slot if badge creation fails", async () => {
    const { redeemLink } = await import("@/lib/badge-redemption");
    testState.createUserCreatedBadgeMock.mockResolvedValue(null);

    const result = await redeemLink("badge-token", "user-a");

    expect(result).toEqual({ error: "Failed to add badge" });
    expect(testState.events).toHaveLength(0);
    expect(testState.link?.redemptionCount).toBe(0);
  });

  it("does not mint duplicate badges for concurrent same-user redemption", async () => {
    const { redeemLink } = await import("@/lib/badge-redemption");
    if (testState.link) {
      testState.link.maxRedemptions = 2;
      testState.link.redemptionCount = 0;
    }

    const [a, b] = await Promise.all([
      redeemLink("badge-token", "user-a"),
      redeemLink("badge-token", "user-a"),
    ]);

    const successes = [a, b].filter((r) => "success" in r).length;
    expect(successes).toBe(1);
    expect(testState.events).toHaveLength(1);
    expect(testState.createUserCreatedBadgeMock).toHaveBeenCalledTimes(1);
  });

  it("allows only one redeemer for legacy single-use links under concurrency", async () => {
    const { redeemLink } = await import("@/lib/badge-redemption");
    if (testState.link) {
      testState.link.maxRedemptions = undefined;
      testState.link.redemptionCount = undefined;
    }

    const [a, b] = await Promise.all([
      redeemLink("badge-token", "user-a"),
      redeemLink("badge-token", "user-b"),
    ]);

    const successes = [a, b].filter((r) => "success" in r).length;
    const failures = [a, b].filter((r) => "error" in r).length;
    expect(successes).toBe(1);
    expect(failures).toBe(1);
    expect(testState.createUserCreatedBadgeMock).toHaveBeenCalledTimes(1);
    expect(testState.link?.usedAt).not.toBeNull();
    expect(["user-a", "user-b"]).toContain(testState.link?.usedBy ?? "");
  });

  it("releases legacy single-use claim when badge creation fails", async () => {
    const { redeemLink } = await import("@/lib/badge-redemption");
    if (testState.link) {
      testState.link.maxRedemptions = undefined;
      testState.link.redemptionCount = undefined;
    }
    testState.createUserCreatedBadgeMock.mockResolvedValue(null);

    const result = await redeemLink("badge-token", "user-a");

    expect(result).toEqual({ error: "Failed to add badge" });
    expect(testState.link?.usedAt).toBeNull();
    expect(testState.link?.usedBy).toBeNull();
  });
});
