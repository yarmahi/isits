import { describe, expect, it } from "vitest";
import { formatRecordEventLabel } from "@/lib/record-activity";

/** Chapter 2 Phase G: stable labels for record detail timeline (no DB). */
describe("formatRecordEventLabel", () => {
  it("maps known record audit event types", () => {
    expect(formatRecordEventLabel("record_create")).toBe("Record created");
    expect(formatRecordEventLabel("record_update")).toBe("Record updated");
    expect(formatRecordEventLabel("record_archive")).toBe("Archived");
    expect(formatRecordEventLabel("record_restore")).toBe("Restored");
  });

  it("humanizes unknown types without throwing", () => {
    expect(formatRecordEventLabel("record_custom_event")).toContain("Custom");
  });
});
