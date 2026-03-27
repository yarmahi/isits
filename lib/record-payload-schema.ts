import { z } from "zod";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
const optionalDateStr = z
  .union([z.literal(""), dateStr])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

/** Shared record form payload (create + update body). */
export const recordFieldsSchema = z.object({
  dateReceived: dateStr,
  dateReturned: optionalDateStr,
  branchId: z.string().min(1, "Select a branch"),
  pcModel: z.string().min(1).max(500),
  serialNumber: z.string().min(1).max(500),
  tagNumber: z.string().max(500).optional(),
  maintenanceNote: z.string().max(10000).optional(),
  customerName: z.string().min(1).max(500),
  phoneNumber: z.string().min(1).max(80),
  statusId: z.string().min(1, "Select a status"),
  deliveryMethodId: z.string().min(1, "Select a delivery method"),
  customData: z.record(z.string(), z.unknown()).optional(),
});

export const updateRecordPayloadSchema = recordFieldsSchema.extend({
  recordId: z.string().min(1),
});
