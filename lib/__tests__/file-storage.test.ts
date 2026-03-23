import { describe, it, expect } from "vitest";
import { __test__ } from "@/lib/file-storage";

const { parseRangeHeader } = __test__;

describe("file-storage parseRangeHeader", () => {
  it("returns full file when range invalid or absent", () => {
    expect(parseRangeHeader(null, 100).ok).toBe(false);
    expect(parseRangeHeader("bytes=0-9", 100).ok).toBe(true);
  });

  it("parses bytes=start-end", () => {
    const p = parseRangeHeader("bytes=0-9", 1000);
    expect(p.ok && p.start === 0 && p.end === 9).toBe(true);
  });

  it("parses open-ended range bytes=start-", () => {
    const p = parseRangeHeader("bytes=500-", 1000);
    expect(p.ok && p.start === 500 && p.end === 999).toBe(true);
  });

  it("parses suffix bytes=-N", () => {
    const p = parseRangeHeader("bytes=-100", 1000);
    expect(p.ok && p.start === 900 && p.end === 999).toBe(true);
  });

  it("rejects out-of-range start", () => {
    expect(parseRangeHeader("bytes=2000-3000", 1000).ok).toBe(false);
  });
});
