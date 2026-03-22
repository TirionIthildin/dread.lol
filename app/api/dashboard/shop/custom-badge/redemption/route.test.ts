import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getOrCreateUser: vi.fn(),
  canUseDashboard: vi.fn(),
  getCustomBadgeAddonCount: vi.fn(),
  isCreatorProgramBadge: vi.fn(),
  isVerifiedCreator: vi.fn(),
  createRedemptionLink: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/member-profiles", () => ({
  getOrCreateUser: mocks.getOrCreateUser,
}));

vi.mock("@/lib/dashboard-access", () => ({
  canUseDashboard: mocks.canUseDashboard,
}));

vi.mock("@/lib/custom-badge-addon", () => ({
  getCustomBadgeAddonCount: mocks.getCustomBadgeAddonCount,
}));

vi.mock("@/lib/user-created-badge", () => ({
  isCreatorProgramBadge: mocks.isCreatorProgramBadge,
}));

vi.mock("@/lib/creator-program", () => ({
  isVerifiedCreator: mocks.isVerifiedCreator,
}));

vi.mock("@/lib/badge-redemption", () => ({
  createRedemptionLink: mocks.createRedemptionLink,
}));

describe("POST /api/dashboard/shop/custom-badge/redemption", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.getOrCreateUser.mockReset();
    mocks.canUseDashboard.mockReset();
    mocks.getCustomBadgeAddonCount.mockReset();
    mocks.isCreatorProgramBadge.mockReset();
    mocks.isVerifiedCreator.mockReset();
    mocks.createRedemptionLink.mockReset();

    mocks.getSession.mockResolvedValue({ sub: "user-1" });
    mocks.getOrCreateUser.mockResolvedValue({ id: "user-1", approved: true, isAdmin: false });
    mocks.canUseDashboard.mockReturnValue(true);
  });

  it("blocks creator-program link minting when creator status is revoked", async () => {
    const { POST } = await import("@/app/api/dashboard/shop/custom-badge/redemption/route");

    mocks.getCustomBadgeAddonCount.mockResolvedValue(0);
    mocks.isCreatorProgramBadge.mockResolvedValue(true);
    mocks.isVerifiedCreator.mockResolvedValue(false);

    const response = await POST({
      json: async () => ({ badgeId: "507f1f77bcf86cd799439011" }),
    } as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Custom badge addon required" });
    expect(mocks.createRedemptionLink).not.toHaveBeenCalled();
  });
});
