import { describe, it, expect } from "vitest";
import { requireHttpOrSameOriginPath, validateRedirectUrl } from "@/lib/validate-url";

describe("requireHttpOrSameOriginPath", () => {
  it("allows https URLs", () => {
    expect(requireHttpOrSameOriginPath("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png"
    );
  });

  it("allows same-site upload paths from /api/files", () => {
    expect(
      requireHttpOrSameOriginPath("/api/files/550e8400-e29b-41d4-a456-426614174000")
    ).toBe("/api/files/550e8400-e29b-41d4-a456-426614174000");
  });

  it("rejects protocol-relative URLs", () => {
    expect(() => requireHttpOrSameOriginPath("//evil.com/x")).toThrow(/valid path/);
  });

  it("rejects javascript URLs", () => {
    expect(() => requireHttpOrSameOriginPath("javascript:alert(1)")).toThrow(/valid path/);
  });
});

describe("validateRedirectUrl", () => {
  const origin = "https://dread.lol";

  it("allows relative paths", () => {
    expect(validateRedirectUrl("/api/files/1,abc", origin)).toBe("/api/files/1,abc");
    expect(
      validateRedirectUrl(
        "/api/files/550e8400-e29b-41d4-a456-426614174000",
        origin
      )
    ).toBe("/api/files/550e8400-e29b-41d4-a456-426614174000");
    expect(validateRedirectUrl("/dashboard", origin)).toBe("/dashboard");
  });

  it("allows same-origin URLs", () => {
    expect(validateRedirectUrl("https://dread.lol/api/og/user", origin)).toBe(
      "https://dread.lol/api/og/user"
    );
  });

  it("rejects cross-origin URLs", () => {
    expect(validateRedirectUrl("https://evil.com/image.png", origin)).toBeUndefined();
    expect(validateRedirectUrl("http://evil.com/image.png", origin)).toBeUndefined();
  });

  it("rejects non-http(s) protocols", () => {
    expect(validateRedirectUrl("javascript:alert(1)", origin)).toBeUndefined();
    expect(validateRedirectUrl("data:text/html,<script>", origin)).toBeUndefined();
  });

  it("rejects protocol-relative paths", () => {
    expect(validateRedirectUrl("//evil.com/image.png", origin)).toBeUndefined();
  });

  it("returns undefined for empty input", () => {
    expect(validateRedirectUrl("", origin)).toBeUndefined();
    expect(validateRedirectUrl(null, origin)).toBeUndefined();
    expect(validateRedirectUrl(undefined, origin)).toBeUndefined();
  });
});
