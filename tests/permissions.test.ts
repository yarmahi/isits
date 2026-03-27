import { describe, expect, it } from "vitest";
import { isManagerRole } from "@/lib/permissions";

describe("isManagerRole", () => {
  it("returns true for manager", () => {
    expect(isManagerRole("manager")).toBe(true);
  });

  it("returns false for specialist and undefined", () => {
    expect(isManagerRole("specialist")).toBe(false);
    expect(isManagerRole(undefined)).toBe(false);
  });
});
