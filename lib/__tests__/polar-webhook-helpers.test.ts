import { describe, it, expect } from "vitest";
import { getPolarExternalId } from "@/lib/polar-webhook-helpers";

describe("getPolarExternalId", () => {
  it("returns null for non-objects", () => {
    expect(getPolarExternalId(null)).toBeNull();
    expect(getPolarExternalId(undefined)).toBeNull();
    expect(getPolarExternalId("x")).toBeNull();
  });

  it("reads customer.external_id", () => {
    expect(
      getPolarExternalId({ customer: { external_id: "user-1" } })
    ).toBe("user-1");
  });

  it("reads customer.externalId", () => {
    expect(getPolarExternalId({ customer: { externalId: "user-2" } })).toBe("user-2");
  });

  it("reads top-level customer_external_id", () => {
    expect(getPolarExternalId({ customer_external_id: "user-3" })).toBe("user-3");
  });

  it("returns null when id fields are missing or not strings", () => {
    expect(getPolarExternalId({ customer: {} })).toBeNull();
    expect(getPolarExternalId({ customer: { external_id: 1 } })).toBeNull();
  });
});
