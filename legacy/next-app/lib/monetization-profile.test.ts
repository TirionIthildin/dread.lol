import { describe, expect, it } from "vitest";
import {
  filterLinksForPremiumAccess,
  parseCommissionStatus,
  PREMIUM_MONETIZATION_LINK_TYPES,
} from "./monetization-profile";
import { resolveLinkTypeFromSavedLink } from "./link-entries";

describe("filterLinksForPremiumAccess", () => {
  const sample = [
    { label: "Ko-fi", href: "https://ko-fi.com/user" },
    { label: "GitHub", href: "https://github.com/x" },
  ];

  it("keeps all links when user has Premium", () => {
    expect(filterLinksForPremiumAccess(sample, true)).toEqual(sample);
  });

  it("removes Premium monetization links when user lacks Premium", () => {
    expect(filterLinksForPremiumAccess(sample, false)).toEqual([{ label: "GitHub", href: "https://github.com/x" }]);
  });

  it("tags kofi/throne/amazon as premium types via resolveLinkTypeFromSavedLink", () => {
    expect(PREMIUM_MONETIZATION_LINK_TYPES.length).toBe(3);
    expect(resolveLinkTypeFromSavedLink("Ko-fi", "https://ko-fi.com/x")).toBe("kofi");
    expect(resolveLinkTypeFromSavedLink("Tip", "https://throne.com/x")).toBe("throne");
    expect(resolveLinkTypeFromSavedLink("Wishlist", "https://www.amazon.com/hz/wishlist/ls/xxx")).toBe("amazonWishlist");
  });

  it("resolves OnlyFans, NameMC, and email", () => {
    expect(resolveLinkTypeFromSavedLink("Fans", "https://onlyfans.com/u123")).toBe("onlyfans");
    expect(resolveLinkTypeFromSavedLink("MC", "https://namemc.com/profile/Notch.1")).toBe("namemc");
    expect(resolveLinkTypeFromSavedLink("Mail", "mailto:a@b.co")).toBe("email");
    expect(resolveLinkTypeFromSavedLink("Mail", "a@b.co")).toBe("email");
  });
});

describe("parseCommissionStatus", () => {
  it("parses allowed values", () => {
    expect(parseCommissionStatus("open")).toBe("open");
    expect(parseCommissionStatus("closed")).toBe("closed");
    expect(parseCommissionStatus("waitlist")).toBe("waitlist");
  });

  it("returns null for empty or invalid", () => {
    expect(parseCommissionStatus("")).toBeNull();
    expect(parseCommissionStatus("bogus")).toBeNull();
  });
});
