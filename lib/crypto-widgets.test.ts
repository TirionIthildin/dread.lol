import { describe, expect, it } from "vitest";
import { parseEnabledCryptoIds, MAX_CRYPTO_WIDGET_COINS, ALLOWED_CRYPTO_IDS } from "@/lib/crypto-widgets";

describe("parseEnabledCryptoIds", () => {
  it("returns empty for empty input", () => {
    expect(parseEnabledCryptoIds(undefined)).toEqual([]);
    expect(parseEnabledCryptoIds(null)).toEqual([]);
    expect(parseEnabledCryptoIds("")).toEqual([]);
    expect(parseEnabledCryptoIds("  ")).toEqual([]);
  });

  it("filters to allowlist and preserves order", () => {
    expect(parseEnabledCryptoIds("bitcoin,ethereum")).toEqual(["bitcoin", "ethereum"]);
  });

  it("dedupes and lowercases", () => {
    expect(parseEnabledCryptoIds("Bitcoin,bitcoin, ETHEREUM ")).toEqual(["bitcoin", "ethereum"]);
  });

  it("drops unknown ids", () => {
    expect(parseEnabledCryptoIds("bitcoin,not-a-real-coin,ethereum")).toEqual(["bitcoin", "ethereum"]);
  });

  it("caps at MAX_CRYPTO_WIDGET_COINS", () => {
    const many = ALLOWED_CRYPTO_IDS.slice(0, MAX_CRYPTO_WIDGET_COINS + 3).join(",");
    expect(parseEnabledCryptoIds(many).length).toBe(MAX_CRYPTO_WIDGET_COINS);
  });
});
