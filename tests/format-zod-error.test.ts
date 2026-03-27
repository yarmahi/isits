import { describe, expect, it } from "vitest";
import { z } from "zod";
import { formatZodError } from "@/lib/format-zod-error";

describe("formatZodError", () => {
  it("includes field label for branchId", () => {
    const r = z
      .object({ branchId: z.string().min(1, "Select a branch") })
      .safeParse({ branchId: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = formatZodError(r.error);
      expect(msg).toMatch(/Branch/i);
    }
  });
});
