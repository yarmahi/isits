import { describe, expect, it } from "vitest";
import {
  escapeLikePattern,
  hasAdvancedRecordFilters,
  parseRecordsListParams,
} from "@/lib/records-list";

describe("escapeLikePattern", () => {
  it("escapes ILIKE special characters", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
    expect(escapeLikePattern("a_b")).toBe("a\\_b");
  });
});

describe("parseRecordsListParams", () => {
  it("parses defaults", () => {
    const p = parseRecordsListParams({});
    expect(p.page).toBe(1);
    expect(p.scope).toBe("active");
    expect(p.sort).toBe("created_desc");
  });

  it("parses mine and q", () => {
    const p = parseRecordsListParams({ mine: "1", q: "  hello  " });
    expect(p.mine).toBe(true);
    expect(p.q).toBe("hello");
  });
});

describe("hasAdvancedRecordFilters", () => {
  it("is false for default parsed state", () => {
    expect(hasAdvancedRecordFilters(parseRecordsListParams({}))).toBe(false);
  });

  it("is true when branch filter set", () => {
    const p = parseRecordsListParams({ branchId: "br-main" });
    expect(hasAdvancedRecordFilters(p)).toBe(true);
  });
});
