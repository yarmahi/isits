import { describe, expect, it } from "vitest";
import { parseBool, parseCodeField, parseSortOrder } from "@/lib/import-csv-parse";
import { parseCsvKeyedRows } from "@/lib/parse-csv";

describe("parseCsvKeyedRows", () => {
  it("parses headers and rows", () => {
    const r = parseCsvKeyedRows("a,b\n1,2\n");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows).toEqual([{ a: "1", b: "2" }]);
  });

  it("handles quoted field with comma", () => {
    const r = parseCsvKeyedRows('name,note\nFoo,"a,b,c"\n');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0]).toEqual({ name: "Foo", note: "a,b,c" });
  });

  it("handles newline inside quotes", () => {
    const r = parseCsvKeyedRows('x,y\n"line1\nline2",z\n');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0].x).toContain("line1");
    expect(r.rows[0].y).toBe("z");
  });

  it("lowercases headers", () => {
    const r = parseCsvKeyedRows("Name,CODE\na,b\n");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0]).toEqual({ name: "a", code: "b" });
  });
});

describe("parseBool", () => {
  it("defaults empty to true", () => {
    expect(parseBool(undefined, 1)).toEqual({ ok: true, value: true });
  });
  it("parses false", () => {
    expect(parseBool("false", 1)).toEqual({ ok: true, value: false });
  });
});

describe("parseSortOrder", () => {
  it("defaults blank to 0", () => {
    expect(parseSortOrder("", 1, 0)).toBe(0);
  });
  it("parses integer", () => {
    expect(parseSortOrder("42", 1, 0)).toBe(42);
  });
});

describe("parseCodeField", () => {
  it("accepts valid code", () => {
    expect(parseCodeField("ab_12", 1)).toBe("ab_12");
  });
  it("rejects uppercase", () => {
    expect(() => parseCodeField("Ab", 1)).toThrow();
  });
});
