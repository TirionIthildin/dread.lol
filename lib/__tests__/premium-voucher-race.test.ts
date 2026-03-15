import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  link: null as
    | {
        _id: ObjectId;
        token: string;
        createdBy: string;
        maxRedemptions: number;
        redemptionCount?: number;
        expiresAt: Date | null;
      }
    | null,
  redemptions: [] as Array<{ linkId: ObjectId; token: string; redeemedBy: string; creatorId: string; redeemedAt: Date }>,
  setUserBadgesMock: vi.fn(async () => true),
  insertErrorCode: null as number | null,
}));

vi.mock("@/lib/member-profiles", () => ({
  setUserBadges: testState.setUserBadgesMock,
}));

vi.mock("@/lib/db", () => {
  const COLLECTIONS = {
    premiumVoucherLinks: "premium_voucher_links",
    premiumVoucherRedemptions: "premium_voucher_redemptions",
    users: "users",
  } as const;

  return {
    COLLECTIONS,
    getDbName: async () => "test",
    getDb: async () => ({
      db: () => ({
        collection: (name: string) => {
          if (name === COLLECTIONS.premiumVoucherLinks) {
            return {
              findOne: async (query: { token?: string; _id?: ObjectId }) => {
                const link = testState.link;
                if (!link) return null;
                if (query.token && link.token === query.token) return { ...link };
                if (query._id && link._id.equals(query._id)) return { ...link };
                return null;
              },
              findOneAndUpdate: async (
                filter: { _id: ObjectId; redemptionCount?: { $lt?: number } },
                update: { $inc?: { redemptionCount?: number } }
              ) => {
                const link = testState.link;
                if (!link || !link._id.equals(filter._id)) return null;
                const lt = filter.redemptionCount?.$lt;
                if (typeof lt === "number") {
                  if (typeof link.redemptionCount !== "number" || !(link.redemptionCount < lt)) return null;
                }
                if (typeof update.$inc?.redemptionCount === "number") {
                  link.redemptionCount = (link.redemptionCount ?? 0) + update.$inc.redemptionCount;
                }
                return { ...link };
              },
              updateOne: async (
                filter: { _id: ObjectId; redemptionCount?: { $exists?: boolean; $gt?: number } },
                update: { $set?: { redemptionCount?: number }; $inc?: { redemptionCount?: number } }
              ) => {
                const link = testState.link;
                if (!link || !link._id.equals(filter._id)) return { matchedCount: 0, modifiedCount: 0 };
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
                if (typeof update.$inc?.redemptionCount === "number") {
                  link.redemptionCount = (link.redemptionCount ?? 0) + update.$inc.redemptionCount;
                }
                return { matchedCount: 1, modifiedCount: 1 };
              },
            };
          }

          if (name === COLLECTIONS.premiumVoucherRedemptions) {
            return {
              findOne: async (query: { token?: string; redeemedBy?: string }) =>
                testState.redemptions.find(
                  (r) =>
                    (query.token == null || r.token === query.token) &&
                    (query.redeemedBy == null || r.redeemedBy === query.redeemedBy)
                ) ?? null,
              countDocuments: async (query: { token?: string; linkId?: ObjectId }) =>
                testState.redemptions.filter(
                  (r) =>
                    (query.token == null || r.token === query.token) &&
                    (query.linkId == null || r.linkId.equals(query.linkId))
                ).length,
              insertOne: async (doc: { linkId: ObjectId; token: string; redeemedBy: string; creatorId: string; redeemedAt: Date }) => {
                if (typeof testState.insertErrorCode === "number") {
                  const err = new Error("insert failure");
                  (err as Error & { code?: number }).code = testState.insertErrorCode;
                  throw err;
                }
                const duplicate = testState.redemptions.some(
                  (r) => r.linkId.equals(doc.linkId) && r.redeemedBy === doc.redeemedBy
                );
                if (duplicate) {
                  const err = new Error("duplicate key");
                  (err as Error & { code?: number }).code = 11000;
                  throw err;
                }
                testState.redemptions.push(doc);
                return { acknowledged: true };
              },
              deleteOne: async (query: { linkId: ObjectId; redeemedBy: string }) => {
                const idx = testState.redemptions.findIndex(
                  (r) => r.linkId.equals(query.linkId) && r.redeemedBy === query.redeemedBy
                );
                if (idx === -1) return { deletedCount: 0 };
                testState.redemptions.splice(idx, 1);
                return { deletedCount: 1 };
              },
            };
          }

          return {};
        },
      }),
    }),
  };
});

describe("redeemPremiumVoucher", () => {
  beforeEach(() => {
    testState.link = {
      _id: new ObjectId(),
      token: "premium-token",
      createdBy: "creator-1",
      maxRedemptions: 1,
      redemptionCount: undefined,
      expiresAt: null,
    };
    testState.redemptions = [];
    testState.setUserBadgesMock.mockReset();
    testState.setUserBadgesMock.mockResolvedValue(true);
    testState.insertErrorCode = null;
  });

  it("enforces capped redemptions under concurrent requests", async () => {
    const { redeemPremiumVoucher } = await import("@/lib/premium-voucher");

    const [a, b] = await Promise.all([
      redeemPremiumVoucher("premium-token", "user-a"),
      redeemPremiumVoucher("premium-token", "user-b"),
    ]);

    const successes = [a, b].filter((r) => "success" in r).length;
    const failures = [a, b].filter((r) => "error" in r).length;
    expect(successes).toBe(1);
    expect(failures).toBe(1);
    expect(testState.redemptions).toHaveLength(1);
    expect(testState.link?.redemptionCount).toBe(1);
  });

  it("releases reserved slot if grant fails", async () => {
    const { redeemPremiumVoucher } = await import("@/lib/premium-voucher");
    testState.setUserBadgesMock.mockResolvedValue(false);

    const result = await redeemPremiumVoucher("premium-token", "user-a");

    expect(result).toEqual({ error: "Failed to grant Premium" });
    expect(testState.redemptions).toHaveLength(0);
    expect(testState.link?.redemptionCount).toBe(0);
  });

  it("releases reserved slot if grant throws", async () => {
    const { redeemPremiumVoucher } = await import("@/lib/premium-voucher");
    testState.setUserBadgesMock.mockRejectedValue(new Error("db unavailable"));

    await expect(redeemPremiumVoucher("premium-token", "user-a")).rejects.toThrow("db unavailable");
    expect(testState.redemptions).toHaveLength(0);
    expect(testState.link?.redemptionCount).toBe(0);
  });

  it("does not grant premium when redemption logging fails", async () => {
    const { redeemPremiumVoucher } = await import("@/lib/premium-voucher");
    testState.insertErrorCode = 12345;

    const result = await redeemPremiumVoucher("premium-token", "user-a");

    expect(result).toEqual({ error: "Failed to redeem link" });
    expect(testState.setUserBadgesMock).not.toHaveBeenCalled();
    expect(testState.redemptions).toHaveLength(0);
    expect(testState.link?.redemptionCount).toBe(0);
  });
});
