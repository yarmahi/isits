import { ImportRowError } from "@/lib/import-csv-errors";

export function parseBool(
  raw: string | undefined,
  rowNum: number,
): { ok: true; value: boolean } | { ok: false; error: string } {
  if (raw === undefined || raw.trim() === "") {
    return { ok: true, value: true };
  }
  const s = raw.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(s)) return { ok: true, value: true };
  if (["false", "0", "no", "n"].includes(s)) return { ok: true, value: false };
  return {
    ok: false,
    error: `Row ${rowNum}: invalid is_active (use true/false).`,
  };
}

/** 0–99999; blank → `defaultOrder`. */
export function parseSortOrder(
  raw: string | undefined,
  rowNum: number,
  defaultOrder = 0,
): number {
  if (raw === undefined || raw.trim() === "") return defaultOrder;
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(n) || n < 0 || n > 99999) {
    throw new ImportRowError(
      `Row ${rowNum}: sort_order must be 0–99999.`,
    );
  }
  return n;
}
