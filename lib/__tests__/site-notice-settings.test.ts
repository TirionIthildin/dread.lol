import { describe, expect, it } from "vitest";
import {
  getSiteNoticeDisplay,
  normalizeSiteNoticeFromDb,
  parseSiteNoticeVariant,
  SITE_NOTICE_MAX_MESSAGE_LENGTH,
  validateSiteNoticePatch,
} from "@/lib/site-notice-settings";

describe("normalizeSiteNoticeFromDb", () => {
  it("defaults when keys missing", () => {
    expect(normalizeSiteNoticeFromDb({})).toEqual({
      enabled: false,
      message: "",
      showOnHome: false,
      showOnDashboard: false,
      variant: "info",
    });
  });

  it("trims message and caps length", () => {
    const long = "a".repeat(SITE_NOTICE_MAX_MESSAGE_LENGTH + 50);
    const out = normalizeSiteNoticeFromDb({ message: `  ${long}  ` });
    expect(out.message.length).toBe(SITE_NOTICE_MAX_MESSAGE_LENGTH);
    expect(out.message).toBe("a".repeat(SITE_NOTICE_MAX_MESSAGE_LENGTH));
  });
});

describe("parseSiteNoticeVariant", () => {
  it("returns info for invalid values", () => {
    expect(parseSiteNoticeVariant(undefined)).toBe("info");
    expect(parseSiteNoticeVariant("nope")).toBe("info");
    expect(parseSiteNoticeVariant(1)).toBe("info");
  });

  it("accepts valid variants", () => {
    expect(parseSiteNoticeVariant("warning")).toBe("warning");
    expect(parseSiteNoticeVariant("critical")).toBe("critical");
  });
});

describe("getSiteNoticeDisplay", () => {
  it("hides when message empty", () => {
    const s = normalizeSiteNoticeFromDb({
      enabled: true,
      showOnHome: true,
      message: "   ",
    });
    expect(getSiteNoticeDisplay("home", s).show).toBe(false);
  });

  it("respects placement toggles", () => {
    const base = normalizeSiteNoticeFromDb({
      enabled: true,
      message: "Hello",
      showOnHome: true,
      showOnDashboard: false,
    });
    expect(getSiteNoticeDisplay("home", base).show).toBe(true);
    expect(getSiteNoticeDisplay("dashboard", base).show).toBe(false);
  });

  it("hides when disabled", () => {
    const s = normalizeSiteNoticeFromDb({
      enabled: false,
      message: "x",
      showOnHome: true,
    });
    expect(getSiteNoticeDisplay("home", s).show).toBe(false);
  });
});

describe("validateSiteNoticePatch", () => {
  it("rejects non-objects", () => {
    expect(validateSiteNoticePatch(null).ok).toBe(false);
    expect(validateSiteNoticePatch([]).ok).toBe(false);
  });

  it("rejects empty patch", () => {
    expect(validateSiteNoticePatch({}).ok).toBe(false);
  });

  it("accepts valid partial field", () => {
    const r = validateSiteNoticePatch({ enabled: true });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.patch).toEqual({ enabled: true });
  });

  it("rejects bad variant", () => {
    expect(validateSiteNoticePatch({ variant: "oops" }).ok).toBe(false);
  });
});
