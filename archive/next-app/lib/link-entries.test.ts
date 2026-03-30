import { describe, expect, it } from "vitest";
import { linkEntriesToFormPayload, normalizeHrefForLinkType, type LinkEntry } from "./link-entries";

describe("normalizeHrefForLinkType", () => {
  it("prefixes bare email with mailto for email type", () => {
    expect(normalizeHrefForLinkType("email", "  user@example.com  ")).toBe("mailto:user@example.com");
  });

  it("preserves existing mailto", () => {
    expect(normalizeHrefForLinkType("email", "mailto:user@example.com")).toBe("mailto:user@example.com");
  });
});

describe("linkEntriesToFormPayload", () => {
  it("persists optional iconName for custom links", () => {
    const entries: LinkEntry[] = [
      { type: "custom", value: "https://x.com", customLabel: "X", customIconName: "RocketLaunch" },
    ];
    const { linksJson } = linkEntriesToFormPayload(entries);
    expect(JSON.parse(linksJson)).toEqual([
      { label: "X", href: "https://x.com", iconName: "RocketLaunch" },
    ]);
  });
});
