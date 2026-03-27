/** Column headers and example rows for CSV templates (Chapter 3 Phase B–E will persist). */

export const BRANCHES_IMPORT = {
  filename: "branches-template.csv",
  /** `id` optional — leave empty to assign a new id server-side. */
  headers: ["id", "name", "is_active"],
  exampleRow: ["", "Main office", "true"],
} as const;

export const STATUSES_IMPORT = {
  filename: "statuses-template.csv",
  headers: ["code", "name", "sort_order", "is_active"],
  exampleRow: ["example_status", "Example", "10", "true"],
} as const;

export const DELIVERY_METHODS_IMPORT = {
  filename: "delivery-methods-template.csv",
  headers: ["code", "name", "sort_order", "is_active"],
  exampleRow: ["example_dm", "Example", "10", "true"],
} as const;

/** Placeholder columns for legacy record import (Phase E expands parsing). */
export const RECORDS_IMPORT = {
  filename: "records-template.csv",
  headers: [
    "record_no",
    "date_received",
    "date_returned",
    "branch_id",
    "pc_model",
    "serial_number",
    "customer_name",
    "phone_number",
    "status_id",
    "delivery_method_id",
  ],
  exampleRow: [
    "R-EXAMPLE-1",
    "2025-01-15",
    "",
    "br-main",
    "PC-100",
    "SN123",
    "Jane Doe",
    "+1000000000",
    "st-received",
    "dm-physical",
  ],
} as const;
