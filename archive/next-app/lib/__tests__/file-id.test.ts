import { describe, it, expect } from "vitest";
import {
  extractFileIdFromFilesUrl,
  fileIdFromPath,
  isValidFileId,
  normalizeFileId,
} from "@/lib/file-id";

describe("file-id", () => {
  it("accepts legacy Seaweed ids", () => {
    expect(isValidFileId("3,0123456789abcdef")).toBe(true);
    expect(fileIdFromPath("/api/files/3,0123456789abcdef")).toBe("3,0123456789abcdef");
  });

  it("accepts UUID v4 ids", () => {
    const id = "550e8400-e29b-41d4-a456-426614174000";
    expect(isValidFileId(id)).toBe(true);
    expect(fileIdFromPath(`/api/files/${id}`)).toBe(id);
  });

  it("rejects traversal and invalid ids", () => {
    expect(isValidFileId("../etc/passwd")).toBe(false);
    expect(isValidFileId("")).toBe(false);
    expect(fileIdFromPath("/api/files/evil")).toBeNull();
  });

  it("normalizes case for uuid and legacy hex", () => {
    expect(normalizeFileId("550E8400-E29B-41D4-A456-426614174000")).toBe(
      "550e8400-e29b-41d4-a456-426614174000"
    );
    expect(normalizeFileId("3,ABCDEF")).toBe("3,abcdef");
  });

  it("extractFileIdFromFilesUrl works on paths and full URLs", () => {
    expect(extractFileIdFromFilesUrl("https://dread.lol/api/files/3,abc")).toBe("3,abc");
    expect(
      extractFileIdFromFilesUrl(
        "https://dread.lol/api/files/550e8400-e29b-41d4-a456-426614174000"
      )
    ).toBe("550e8400-e29b-41d4-a456-426614174000");
  });
});
