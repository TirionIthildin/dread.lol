import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  profiles: [] as Array<Record<string, unknown>>,
  aliases: [] as Array<Record<string, unknown>>,
  findOneAndUpdateCalls: 0,
  lastSet: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/db", () => {
  const COLLECTIONS = {
    profiles: "profiles",
    profileAliases: "profile_aliases",
  } as const;

  return {
    COLLECTIONS,
    getDbName: async () => "test",
    getDb: async () => ({
      db: () => ({
        collection: (name: string) => {
          if (name === COLLECTIONS.profiles) {
            return {
              findOne: async (query: { _id?: ObjectId; slug?: string }) => {
                if (query._id) {
                  return (
                    testState.profiles.find((p) =>
                      ((p._id as ObjectId) ?? null)?.equals(query._id as ObjectId)
                    ) ?? null
                  );
                }
                if (typeof query.slug === "string") {
                  return (
                    testState.profiles.find((p) => (p.slug as string) === query.slug) ??
                    null
                  );
                }
                return null;
              },
              findOneAndUpdate: async (
                filter: { _id: ObjectId; userId: string },
                update: { $set?: Record<string, unknown> }
              ) => {
                const row = testState.profiles.find(
                  (p) =>
                    ((p._id as ObjectId) ?? null)?.equals(filter._id) &&
                    p.userId === filter.userId
                );
                if (!row) return null;
                testState.findOneAndUpdateCalls += 1;
                const setDoc = update.$set ?? {};
                testState.lastSet = setDoc;
                Object.assign(row, setDoc);
                return row;
              },
            };
          }

          if (name === COLLECTIONS.profileAliases) {
            return {
              findOne: async (query: { slug?: string }) =>
                testState.aliases.find((a) => a.slug === query.slug) ?? null,
            };
          }

          return {
            findOne: async () => null,
          };
        },
      }),
    }),
  };
});

vi.mock("@/lib/member-profiles/profile-aliases", () => ({
  isPrimarySlugTaken: vi.fn(
    async (slug: string, excludeProfileId?: string | null) =>
      testState.profiles.some(
        (p) =>
          p.slug === slug &&
          ((p._id as ObjectId).toString() !== (excludeProfileId ?? ""))
      )
  ),
  isAliasSlugTaken: vi.fn(
    async (slug: string) => testState.aliases.some((a) => a.slug === slug)
  ),
  normalizeAndAssertPrimarySlugAvailable: vi.fn(
    async (rawSlug: string, options?: { excludeProfileId?: string | null }) => {
      const normalized = rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 64);
      if (!normalized) {
        throw new Error("Slug is required (letters, numbers, hyphen, underscore)");
      }
      const primaryConflict = testState.profiles.find(
        (p) =>
          p.slug === normalized &&
          ((p._id as ObjectId).toString() !== (options?.excludeProfileId ?? ""))
      );
      if (primaryConflict) {
        throw new Error("That slug is already taken.");
      }
      const aliasConflict = testState.aliases.find((a) => a.slug === normalized);
      if (aliasConflict) {
        throw new Error("That slug is already taken.");
      }
      return normalized;
    }
  ),
  resolveMemberProfileBySlug: vi.fn(async () => null),
}));

describe("updateMemberProfile slug guard", () => {
  beforeEach(() => {
    testState.findOneAndUpdateCalls = 0;
    testState.lastSet = null;
    const ownerProfileId = new ObjectId("66a111111111111111111111");
    const otherProfileId = new ObjectId("66a222222222222222222222");
    testState.profiles = [
      {
        _id: ownerProfileId,
        userId: "owner-user",
        slug: "owner",
        name: "Owner",
        description: "",
      },
      {
        _id: otherProfileId,
        userId: "other-user",
        slug: "other",
        name: "Other",
        description: "",
      },
    ];
    testState.aliases = [
      {
        _id: new ObjectId("66a333333333333333333333"),
        profileId: otherProfileId,
        slug: "shared-handle",
      },
    ];
  });

  it("rejects updates that collide with an existing alias slug", async () => {
    const { updateMemberProfile } = await import("@/lib/member-profiles/core");
    const ownerId = (testState.profiles[0]?._id as ObjectId).toString();

    await expect(
      updateMemberProfile(ownerId, "owner-user", { slug: "shared-handle" })
    ).rejects.toThrow("That slug is already taken.");

    expect(testState.findOneAndUpdateCalls).toBe(0);
  });

  it("normalizes and stores available primary slugs", async () => {
    const { updateMemberProfile } = await import("@/lib/member-profiles/core");
    const ownerId = (testState.profiles[0]?._id as ObjectId).toString();

    await updateMemberProfile(ownerId, "owner-user", { slug: "  New Slug!!  " });

    expect(testState.findOneAndUpdateCalls).toBe(1);
    expect(testState.lastSet?.slug).toBe("new-slug");
  });
});
