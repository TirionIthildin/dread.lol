import { SRP_G, SRP_K, SRP_N_HEX } from "./constants";

let _n: bigint | null = null;

export function srpN(): bigint {
  if (_n === null) {
    _n = BigInt(`0x${SRP_N_HEX}`);
  }
  return _n;
}

/** Modular exponentiation (base^exp mod m). */
export function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  if (m === 1n) return 0n;
  let result = 1n;
  let b = ((base % m) + m) % m;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % m;
    }
    e >>= 1n;
    b = (b * b) % m;
  }
  return result;
}

export function randomBelowModN(): bigint {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let x = 0n;
  for (let i = 0; i < bytes.length; i++) {
    x = (x << 8n) | BigInt(bytes[i]);
  }
  return x % srpN();
}

export function bigintToHex(n: bigint): string {
  if (n === 0n) return "00";
  let hex = n.toString(16);
  if (hex.length % 2 === 1) hex = `0${hex}`;
  return hex;
}

export function hexToBigint(hex: string): bigint {
  const clean = hex.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]+$/i.test(clean)) return 0n;
  return BigInt(`0x${clean}`);
}

export function kMultiplier(): bigint {
  return SRP_K;
}

export function gValue(): bigint {
  return SRP_G;
}
