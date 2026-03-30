import { describe, expect, it } from "vitest";
import { PROFILE_ALIAS_MAX_FREE, PROFILE_ALIAS_MAX_PREMIUM } from "@/lib/premium-features";
import { maxAliasesForPremium } from "@/lib/member-profiles/profile-aliases";

describe("maxAliasesForPremium", () => {
  it("returns free cap when not Premium", () => {
    expect(maxAliasesForPremium(false)).toBe(PROFILE_ALIAS_MAX_FREE);
  });

  it("returns premium cap when Premium", () => {
    expect(maxAliasesForPremium(true)).toBe(PROFILE_ALIAS_MAX_PREMIUM);
  });
});
