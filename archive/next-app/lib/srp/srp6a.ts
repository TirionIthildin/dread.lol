/**
 * SRP-6a matching Erebor `erebor-crypto/src/srp.rs` (RFC 5054 2048-bit group).
 */
import { gValue, hexToBigint, kMultiplier, modPow, randomBelowModN, bigintToHex, srpN } from "./bigint";
import { concatBytes, hexToBytes, utf8 } from "./bytes";
import { hashHex, hashToBigint } from "./hash";

function timingSafeEqualHex(a: string, b: string): boolean {
  const ac = a.trim().toLowerCase();
  const bc = b.trim().toLowerCase();
  if (ac.length !== bc.length || ac.length !== 64) return false;
  let ok = 0;
  for (let i = 0; i < ac.length; i++) {
    ok |= ac.charCodeAt(i) ^ bc.charCodeAt(i);
  }
  return ok === 0;
}

/** 32-byte salt as 64 hex chars. */
export function generateSalt(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Verifier v = g^x mod N; x = H(salt_bytes || H(username:password_as_hex_utf8)). */
export function generateVerifier(username: string, password: string, saltHex: string): string {
  const n = srpN();
  const g = gValue();
  const inner = `${username}:${password}`;
  const innerHash = hashHex(inner);
  const saltBytes = hexToBytes(saltHex);
  const xInput = concatBytes(saltBytes, utf8(innerHash));
  const x = hashToBigint(xInput) % n;
  const v = modPow(g, x, n);
  return bigintToHex(v);
}

export class SrpServerSession {
  private readonly username: string;
  private readonly salt: string;
  private readonly verifier: bigint;
  private readonly b: bigint;
  private readonly bPublic: bigint;
  private aPublic: bigint | null = null;
  private u: bigint | null = null;
  private s: bigint | null = null;
  private k: string | null = null;

  constructor(username: string, salt: string, verifierHex: string, b?: bigint, bPublic?: bigint) {
    const n = srpN();
    const g = gValue();
    const kMul = kMultiplier();
    this.username = username;
    this.salt = salt;
    this.verifier = hexToBigint(verifierHex);
    if (b !== undefined && bPublic !== undefined) {
      this.b = b;
      this.bPublic = bPublic;
    } else {
      this.b = randomBelowModN();
      const gb = modPow(g, this.b, n);
      const kv = (kMul * this.verifier) % n;
      this.bPublic = (kv + gb) % n;
    }
  }

  static fromStored(
    username: string,
    salt: string,
    verifierHex: string,
    bHex: string,
    bPublicHex: string
  ): SrpServerSession {
    return new SrpServerSession(username, salt, verifierHex, hexToBigint(bHex), hexToBigint(bPublicHex));
  }

  get publicValue(): string {
    return bigintToHex(this.bPublic);
  }

  get bHex(): string {
    return bigintToHex(this.b);
  }

  get saltValue(): string {
    return this.salt;
  }

  setClientPublic(aHex: string): void {
    const n = srpN();
    const a = hexToBigint(aHex);
    if (a % n === 0n) {
      throw new Error("Invalid client public value");
    }
    this.aPublic = a;
    const uStr = `${bigintToHex(a)}:${bigintToHex(this.bPublic)}`;
    this.u = hashToBigint(utf8(uStr));
    const vu = modPow(this.verifier, this.u, n);
    const avu = (a * vu) % n;
    this.s = modPow(avu, this.b, n);
    const sHex = bigintToHex(this.s);
    this.k = hashHex(utf8(sHex));
  }

  verifyClientProof(m1Hex: string): string {
    const sVal = this.s;
    const a = this.aPublic;
    if (sVal === null || a === null) throw new Error("Session not initialized");
    const expectedM1 = hashHex(
      utf8(`${bigintToHex(a)}:${bigintToHex(this.bPublic)}:${bigintToHex(sVal)}`)
    );
    if (!timingSafeEqualHex(m1Hex, expectedM1)) {
      throw new Error("Invalid client proof");
    }
    return hashHex(utf8(`${bigintToHex(a)}:${m1Hex}:${bigintToHex(sVal)}`));
  }

  get sessionKey(): string | null {
    return this.k;
  }
}

export class SrpClientSession {
  private readonly username: string;
  private readonly password: string;
  private readonly a: bigint;
  private readonly aPublic: bigint;
  private bPublic: bigint | null = null;
  private u: bigint | null = null;
  private s: bigint | null = null;
  private k: string | null = null;

  constructor(username: string, password: string, a?: bigint) {
    const n = srpN();
    const g = gValue();
    this.username = username;
    this.password = password;
    this.a = a ?? randomBelowModN();
    this.aPublic = modPow(g, this.a, n);
  }

  get publicValue(): string {
    return bigintToHex(this.aPublic);
  }

  setServerPublic(bHex: string, saltHex: string): void {
    const n = srpN();
    const g = gValue();
    const kMul = kMultiplier();
    const b = hexToBigint(bHex);
    if (b % n === 0n) {
      throw new Error("Invalid server public value");
    }
    this.bPublic = b;
    const uStr = `${bigintToHex(this.aPublic)}:${bigintToHex(b)}`;
    this.u = hashToBigint(utf8(uStr));
    const inner = `${this.username}:${this.password}`;
    const innerHash = hashHex(inner);
    const saltBytes = hexToBytes(saltHex);
    const xInput = concatBytes(saltBytes, utf8(innerHash));
    const x = hashToBigint(xInput) % n;
    const gx = modPow(g, x, n);
    const kgx = (kMul * gx) % n;
    const bKgx = (((b - kgx) % n) + n) % n;
    const aux = this.a + (this.u ?? 0n) * x;
    this.s = modPow(bKgx, aux, n);
    const sHex = bigintToHex(this.s);
    this.k = hashHex(utf8(sHex));
  }

  clientProof(): string {
    const sVal = this.s;
    const b = this.bPublic;
    if (sVal === null || b === null) throw new Error("Session not initialized");
    return hashHex(utf8(`${bigintToHex(this.aPublic)}:${bigintToHex(b)}:${bigintToHex(sVal)}`));
  }

  verifyServerProof(m2Hex: string): boolean {
    const m1 = this.clientProof();
    const sVal = this.s;
    if (sVal === null) return false;
    const expectedM2 = hashHex(utf8(`${bigintToHex(this.aPublic)}:${m1}:${bigintToHex(sVal)}`));
    return timingSafeEqualHex(m2Hex, expectedM2);
  }

  get sessionKey(): string | null {
    return this.k;
  }
}
