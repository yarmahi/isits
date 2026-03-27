import type { ZodError } from "zod";

/** Maps common Zod issue paths to form labels (server-side validation messages). */
const FIELD_LABELS: Record<string, string> = {
  dateReceived: "Date received",
  dateReturned: "Date returned",
  branchId: "Branch",
  pcModel: "PC model",
  serialNumber: "Serial number",
  tagNumber: "Tag number",
  maintenanceNote: "Maintenance note",
  customerName: "Customer name",
  phoneNumber: "Phone number",
  statusId: "Status",
  deliveryMethodId: "Delivery method",
  customData: "Additional fields",
  recordId: "Record",
  name: "Name",
  username: "Username",
  password: "Password",
  newPassword: "New password",
  userId: "User",
  isActive: "Account status",
  label: "Label",
  fieldType: "Field type",
  selectOptions: "Select options",
  id: "Item",
};

/** First issue message, prefixed with a friendly field label when helpful. */
export function formatZodError(err: ZodError): string {
  const issue = err.issues[0];
  if (!issue) {
    return "Something went wrong. Check your input and try again.";
  }
  const key =
    typeof issue.path[0] === "string" ? issue.path[0] : String(issue.path[0] ?? "");
  const label = key ? (FIELD_LABELS[key] ?? humanizeKey(key)) : null;
  const msg = issue.message;
  if (label && msg && !msgIncludesLabel(msg, label)) {
    return `${label}: ${msg}`;
  }
  return msg || "Invalid input.";
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function msgIncludesLabel(msg: string, label: string): boolean {
  const m = msg.toLowerCase();
  const l = label.toLowerCase();
  return m.includes(l) || l.split(/\s+/).every((w) => w.length < 2 || m.includes(w));
}
