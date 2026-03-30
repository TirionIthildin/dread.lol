import { describe, expect, it } from "vitest";
import { parseWebsiteUrlForSave, shouldOpenProfileLink } from "@/lib/profile-links-display";

describe("shouldOpenProfileLink", () => {
  it("returns true for https URLs", () => {
    expect(shouldOpenProfileLink("https://example.com/x")).toBe(true);
  });

  it("returns false for plain handles and text", () => {
    expect(shouldOpenProfileLink("user")).toBe(false);
    expect(shouldOpenProfileLink("@x")).toBe(false);
    expect(shouldOpenProfileLink("discord.gg/foo")).toBe(false);
  });

  it("returns true for safe mailto", () => {
    expect(shouldOpenProfileLink("mailto:a@b.co")).toBe(true);
  });
});

describe("parseWebsiteUrlForSave", () => {
  it("requires http(s) when copyable socials is off", () => {
    expect(parseWebsiteUrlForSave("not a url", false)).toBeNull();
    expect(parseWebsiteUrlForSave("https://a.com", false)).toBe("https://a.com");
  });

  it("allows non-URL text when copyable socials is on", () => {
    expect(parseWebsiteUrlForSave("  myhandle  ", true)).toBe("myhandle");
  });
});
