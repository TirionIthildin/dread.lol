import { describe, it, expect } from "vitest";
import {
  pasteCreateSchema,
  reportSchema,
  marketplaceApplySchema,
  marketplaceTemplateCreateSchema,
} from "@/lib/api-schemas";

describe("pasteCreateSchema", () => {
  it("accepts valid content and optional language", () => {
    expect(pasteCreateSchema.parse({ content: "hello" })).toEqual({
      content: "hello",
    });
    expect(pasteCreateSchema.parse({ content: "code", language: "javascript" })).toEqual({
      content: "code",
      language: "javascript",
    });
  });

  it("rejects content over 100k chars", () => {
    expect(() =>
      pasteCreateSchema.parse({ content: "x".repeat(100_001) })
    ).toThrow();
  });

  it("requires content", () => {
    expect(() => pasteCreateSchema.parse({})).toThrow();
  });
});

describe("reportSchema", () => {
  it("accepts optional reason", () => {
    expect(reportSchema.parse({})).toEqual({});
    expect(reportSchema.parse({ reason: "spam" })).toEqual({ reason: "spam" });
  });

  it("rejects reason over 1000 chars", () => {
    expect(() => reportSchema.parse({ reason: "x".repeat(1001) })).toThrow();
  });
});

describe("marketplaceApplySchema", () => {
  it("accepts optional profileId", () => {
    expect(marketplaceApplySchema.parse({})).toEqual({});
    expect(marketplaceApplySchema.parse({ profileId: "abc123" })).toEqual({
      profileId: "abc123",
    });
  });

  it("rejects empty profileId after trim", () => {
    expect(marketplaceApplySchema.safeParse({ profileId: "   " }).success).toBe(false);
  });
});

describe("marketplaceTemplateCreateSchema", () => {
  it("accepts fromProfileId path", () => {
    const r = marketplaceTemplateCreateSchema.safeParse({
      fromProfileId: "507f1f77bcf86cd799439011",
    });
    expect(r.success).toBe(true);
  });

  it("accepts raw template with name", () => {
    const r = marketplaceTemplateCreateSchema.safeParse({
      name: "My Template",
      data: { accentColor: "cyan" },
    });
    expect(r.success).toBe(true);
  });

  it("rejects template data over 500KB", () => {
    const r = marketplaceTemplateCreateSchema.safeParse({
      name: "Big",
      data: { x: "y".repeat(600_000) },
    });
    expect(r.success).toBe(false);
  });
});
