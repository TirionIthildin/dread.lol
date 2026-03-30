import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

export function hashHex(input: Uint8Array | string): string {
  const buf = typeof input === "string" ? utf8ToBytes(input) : input;
  return bytesToHex(sha256(buf));
}

/** Same as Erebor: SHA256 -> hex string -> interpret hex digits as big integer. */
export function hashToBigint(input: Uint8Array | string): bigint {
  const hex = hashHex(input);
  return BigInt(`0x${hex}`);
}
