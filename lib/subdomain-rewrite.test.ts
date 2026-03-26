import { describe, expect, it } from "vitest";
import { getSubdomainRewriteKind, rewriteSubdomainPath } from "./subdomain-rewrite";

describe("rewriteSubdomainPath", () => {
  it("maps profile subdomain root and paths", () => {
    expect(rewriteSubdomainPath("alice", "/")).toBe("/alice");
    expect(rewriteSubdomainPath("alice", "/blog")).toBe("/alice/blog");
  });

  it("maps dashboard subdomain root to /dashboard", () => {
    expect(rewriteSubdomainPath("dashboard", "/")).toBe("/dashboard");
  });

  it("passes through /dashboard and /dashboard/... on dashboard host", () => {
    expect(rewriteSubdomainPath("dashboard", "/dashboard")).toBe("/dashboard");
    expect(rewriteSubdomainPath("dashboard", "/dashboard/gallery")).toBe("/dashboard/gallery");
  });

  it("prefixes other paths on dashboard host", () => {
    expect(rewriteSubdomainPath("dashboard", "/gallery")).toBe("/dashboard/gallery");
  });

  it("keeps locale prefix for profile subdomain routes", () => {
    expect(rewriteSubdomainPath("alice", "/es")).toBe("/es/alice");
    expect(rewriteSubdomainPath("alice", "/es/blog")).toBe("/es/alice/blog");
  });

  it("keeps locale prefix for dashboard subdomain routes", () => {
    expect(rewriteSubdomainPath("dashboard", "/es")).toBe("/es/dashboard");
    expect(rewriteSubdomainPath("dashboard", "/es/gallery")).toBe("/es/dashboard/gallery");
    expect(rewriteSubdomainPath("dashboard", "/es/dashboard")).toBe("/es/dashboard");
  });
});

describe("getSubdomainRewriteKind", () => {
  it("returns null for no slug", () => {
    expect(getSubdomainRewriteKind(null)).toBeNull();
  });

  it("classifies dashboard vs profile", () => {
    expect(getSubdomainRewriteKind("dashboard")).toBe("dashboard");
    expect(getSubdomainRewriteKind("alice")).toBe("profile");
  });
});
