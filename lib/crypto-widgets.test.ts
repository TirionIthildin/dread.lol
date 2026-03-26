import { describe, expect, it } from "vitest";
import {
  collectWalletAddressesFromProfile,
  getWalletInputsFromProfileRow,
  isValidCryptoWalletAddress,
  parseCryptoWalletFromProfile,
} from "@/lib/crypto-widgets";

const VALID_ETH = "0x0000000000000000000000000000000000000001";

describe("isValidCryptoWalletAddress", () => {
  it("accepts Ethereum addresses", () => {
    expect(isValidCryptoWalletAddress("ethereum", VALID_ETH)).toBe(true);
  });
  it("rejects Ethereum address with wrong length", () => {
    expect(isValidCryptoWalletAddress("ethereum", `${VALID_ETH}aa`)).toBe(false);
  });
  it("accepts Bitcoin bech32", () => {
    expect(isValidCryptoWalletAddress("bitcoin", "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")).toBe(true);
  });
  it("accepts Bitcoin P2PKH", () => {
    expect(isValidCryptoWalletAddress("bitcoin", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")).toBe(true);
  });
  it("accepts Solana addresses", () => {
    expect(
      isValidCryptoWalletAddress(
        "solana",
        "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"
      )
    ).toBe(true);
  });
});

describe("parseCryptoWalletFromProfile", () => {
  it("returns null when chain or address missing", () => {
    expect(parseCryptoWalletFromProfile(null, VALID_ETH)).toBe(null);
    expect(parseCryptoWalletFromProfile("ethereum", null)).toBe(null);
  });
  it("returns null for invalid pair", () => {
    expect(parseCryptoWalletFromProfile("ethereum", "not-an-address")).toBe(null);
  });
  it("returns parsed pair when valid", () => {
    expect(parseCryptoWalletFromProfile("ethereum", VALID_ETH)).toEqual({ chain: "ethereum", address: VALID_ETH });
  });
});

describe("collectWalletAddressesFromProfile", () => {
  it("collects multiple valid addresses", () => {
    const btc = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
    expect(
      collectWalletAddressesFromProfile({
        cryptoWalletEthereum: VALID_ETH,
        cryptoWalletBitcoin: btc,
        cryptoWalletSolana: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
      })
    ).toEqual({
      ethereum: VALID_ETH,
      bitcoin: btc,
      solana: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    });
  });
  it("falls back to legacy chain+address when per-network empty", () => {
    expect(
      collectWalletAddressesFromProfile({
        cryptoWalletChain: "bitcoin",
        cryptoWalletAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
      })
    ).toEqual({ bitcoin: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" });
  });
});

describe("getWalletInputsFromProfileRow", () => {
  it("maps legacy to the matching network field", () => {
    expect(
      getWalletInputsFromProfileRow({
        cryptoWalletChain: "solana",
        cryptoWalletAddress: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
      })
    ).toEqual({
      ethereum: "",
      bitcoin: "",
      solana: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    });
  });
});
