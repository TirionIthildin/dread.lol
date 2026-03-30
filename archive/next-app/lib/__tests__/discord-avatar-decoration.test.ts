import { describe, it, expect } from "vitest";
import { getAvatarDecorationUrl } from "@/lib/auth/discord";

describe("getAvatarDecorationUrl", () => {
  it("returns null for empty asset", () => {
    expect(getAvatarDecorationUrl("")).toBeNull();
    expect(getAvatarDecorationUrl("   ")).toBeNull();
  });

  it("builds Discord CDN preset URL", () => {
    expect(getAvatarDecorationUrl("a_1269e74af4df7417b13759eae50c83dc")).toBe(
      "https://cdn.discordapp.com/avatar-decoration-presets/a_1269e74af4df7417b13759eae50c83dc.png"
    );
  });

  it("trims asset string", () => {
    expect(getAvatarDecorationUrl("  abc  ")).toBe(
      "https://cdn.discordapp.com/avatar-decoration-presets/abc.png"
    );
  });
});
