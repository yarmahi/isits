/** Column headers and example rows for CSV templates (Chapter 3 Phase B–E will persist). */

export const BRANCHES_IMPORT = {
  filename: "branches-template.csv",
  /** `id` optional — leave empty to assign a new id server-side. */
  headers: ["id", "name", "is_active"],
  exampleRow: ["", "Main office", "true"],
} as const;

export const STATUSES_IMPORT = {
  filename: "statuses-template.csv",
  /** `id` optional — leave empty for a new id. */
  headers: ["id", "code", "name", "sort_order", "is_active"],
  exampleRow: ["", "example_status", "Example", "10", "true"],
} as const;

export const DELIVERY_METHODS_IMPORT = {
  filename: "delivery-methods-template.csv",
  /** `id` optional — leave empty for a new id. */
  headers: ["id", "code", "name", "sort_order", "is_active"],
  exampleRow: ["", "example_dm", "Example", "10", "true"],
} as const;

/** Legacy record import: ids may be real ids or codes/names (see `import-records-csv`). */
export const RECORDS_IMPORT = {
  filename: "records-template.csv",
  headers: [
    "record_no",
    "date_received",
    "date_returned",
    "branch_id",
    "pc_model",
    "serial_number",
    "tag_number",
    "maintenance_note",
    "customer_name",
    "phone_number",
    "status_id",
    "delivery_method_id",
  ],
  exampleRow: [
    "",
    "2025-01-15",
    "",
    "br-main",
    "PC-100",
    "SN123",
    "",
    "",
    "Jane Doe",
    "+1000000000",
    "st-received",
    "dm-physical",
  ],
} as const;
