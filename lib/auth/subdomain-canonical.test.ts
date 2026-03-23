import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { redirectAuthToCanonicalOrigin } from "./subdomain-canonical";

describe("redirectAuthToCanonicalOrigin", () => {
  const prevPublic = process.env.NEXT_PUBLIC_SITE_URL;
  const prevDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://dread.lol";
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "dread.lol";
    delete process.env.SITE_URL;
  });

  afterEach(() => {
    if (prevPublic !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prevPublic;
    else delete process.env.NEXT_PUBLIC_SITE_URL;
    if (prevDomain !== undefined) process.env.NEXT_PUBLIC_SITE_DOMAIN = prevDomain;
    else delete process.env.NEXT_PUBLIC_SITE_DOMAIN;
  });

  it("returns null on apex host", () => {
    const req = new NextRequest("https://dread.lol/api/auth/discord");
    expect(redirectAuthToCanonicalOrigin(req)).toBeNull();
  });

  it("redirects dashboard subdomain to canonical with query", () => {
    const req = new NextRequest("https://dashboard.dread.lol/api/auth/discord?x=1", {
      headers: { host: "dashboard.dread.lol" },
    });
    const res = redirectAuthToCanonicalOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(307);
    expect(res!.headers.get("location")).toBe("https://dread.lol/api/auth/discord?x=1");
  });

  it("does not redirect unrelated hosts", () => {
    const req = new NextRequest("https://evil.example/api/auth/discord", {
      headers: { host: "evil.example" },
    });
    expect(redirectAuthToCanonicalOrigin(req)).toBeNull();
  });
});
