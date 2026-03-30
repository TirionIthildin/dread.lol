import { describe, it, expect } from "vitest";
import { generateSalt, generateVerifier, SrpClientSession, SrpServerSession } from "./srp6a";

describe("SRP-6a", () => {
  it("roundtrip matches session keys", () => {
    const username = "testuser";
    const password = "testpass";
    const salt = generateSalt();
    const verifier = generateVerifier(username, password, salt);

    const client = new SrpClientSession(username, password);
    const aPub = client.publicValue;

    const server = new SrpServerSession(username, salt, verifier);
    const bPub = server.publicValue;

    client.setServerPublic(bPub, salt);
    server.setClientPublic(aPub);

    const m1 = client.clientProof();
    const m2 = server.verifyClientProof(m1);
    expect(client.verifyServerProof(m2)).toBe(true);

    expect(client.sessionKey).toBe(server.sessionKey);
  });

  it("verifier is deterministic", () => {
    const salt = "a".repeat(64);
    const v1 = generateVerifier("alice", "secret", salt);
    const v2 = generateVerifier("alice", "secret", salt);
    expect(v1).toBe(v2);
  });
});
