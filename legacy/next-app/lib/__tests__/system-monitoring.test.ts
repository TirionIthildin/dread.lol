import { describe, it, expect } from "vitest";
import { isValidDiscordWebhookUrl } from "@/lib/system-monitoring";

describe("isValidDiscordWebhookUrl", () => {
  it("accepts standard discord.com webhook URLs", () => {
    expect(
      isValidDiscordWebhookUrl(
        "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH"
      )
    ).toBe(true);
  });

  it("accepts discordapp.com host", () => {
    expect(
      isValidDiscordWebhookUrl(
        "https://discordapp.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH"
      )
    ).toBe(true);
  });

  it("rejects http", () => {
    expect(
      isValidDiscordWebhookUrl(
        "http://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH"
      )
    ).toBe(false);
  });

  it("rejects wrong host", () => {
    expect(
      isValidDiscordWebhookUrl(
        "https://evil.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH"
      )
    ).toBe(false);
  });

  it("rejects missing token segment", () => {
    expect(isValidDiscordWebhookUrl("https://discord.com/api/webhooks/123456789012345678")).toBe(false);
  });

  it("rejects non-numeric webhook id", () => {
    expect(
      isValidDiscordWebhookUrl(
        "https://discord.com/api/webhooks/notanid/abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH"
      )
    ).toBe(false);
  });

  it("rejects short token", () => {
    expect(isValidDiscordWebhookUrl("https://discord.com/api/webhooks/123456789012345678/short")).toBe(false);
  });

  it("rejects empty", () => {
    expect(isValidDiscordWebhookUrl("")).toBe(false);
    expect(isValidDiscordWebhookUrl("   ")).toBe(false);
  });
});
