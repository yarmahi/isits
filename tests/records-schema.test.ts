import { describe, expect, it } from "vitest";
import {
  recordFieldsSchema,
  updateRecordPayloadSchema,
} from "@/lib/record-payload-schema";

const validBase = {
  dateReceived: "2026-01-15",
  dateReturned: "",
  branchId: "br-main",
  pcModel: "PC-1",
  serialNumber: "SN123",
  tagNumber: "",
  maintenanceNote: "",
  customerName: "John",
  phoneNumber: "555-0100",
  statusId: "st-received",
  deliveryMethodId: "dm-physical",
  customData: {},
};

describe("recordFieldsSchema", () => {
  it("accepts a valid payload", () => {
    const r = recordFieldsSchema.safeParse(validBase);
    expect(r.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const r = recordFieldsSchema.safeParse({
      ...validBase,
      dateReceived: "invalid",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty branch", () => {
    const r = recordFieldsSchema.safeParse(validBase);
    expect(r.success).toBe(true);
    const r2 = recordFieldsSchema.safeParse({ ...validBase, branchId: "" });
    expect(r2.success).toBe(false);
  });
});

describe("updateRecordPayloadSchema", () => {
  it("requires recordId", () => {
    const r = updateRecordPayloadSchema.safeParse({
      ...validBase,
      recordId: "rec-1",
    });
    expect(r.success).toBe(true);
    const r2 = updateRecordPayloadSchema.safeParse(validBase);
    expect(r2.success).toBe(false);
  });
});
