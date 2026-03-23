import { describe, it, expect } from "vitest";
import { isDiscordCdnHttpsUrl, safeImageLinkHref } from "@/lib/url-validation";
import { getDiscordApiUserUrl } from "@/lib/discord-flags";

describe("isDiscordCdnHttpsUrl", () => {
  it("accepts Discord CDN https URLs only", () => {
    expect(isDiscordCdnHttpsUrl("https://cdn.discordapp.com/avatars/1/x.png")).toBe(true);
    expect(isDiscordCdnHttpsUrl("http://cdn.discordapp.com/avatars/1/x.png")).toBe(false);
    expect(isDiscordCdnHttpsUrl("https://evil.com/cdn.discordapp.com/x.png")).toBe(false);
    expect(isDiscordCdnHttpsUrl("https://cdn.discordapp.com.evil.com/x")).toBe(false);
  });
});

describe("safeImageLinkHref", () => {
  it("allows paths and http(s)", () => {
    expect(safeImageLinkHref("/api/files/abc")).toBe("/api/files/abc");
    expect(safeImageLinkHref("https://example.com/a.png")).toBe("https://example.com/a.png");
  });

  it("blocks non-http schemes", () => {
    expect(safeImageLinkHref("javascript:alert(1)")).toBe("#");
    expect(safeImageLinkHref("data:text/html,x")).toBe("#");
  });
});

describe("getDiscordApiUserUrl", () => {
  it("builds a fixed Discord API user URL", () => {
    expect(getDiscordApiUserUrl("123456789012345678")).toBe(
      "https://discord.com/api/v10/users/123456789012345678"
    );
  });

  it("rejects invalid snowflakes", () => {
    expect(getDiscordApiUserUrl("123")).toBeNull();
    expect(getDiscordApiUserUrl("https://evil.com")).toBeNull();
  });
});
