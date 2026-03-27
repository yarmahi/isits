import Papa from "papaparse";

/**
 * CSV parsing for server-side import (Chapter 3).
 * Uses [papaparse](https://www.papaparse.com/) — handles quotes, commas, newlines in fields.
 */
export function parseCsvKeyedRows(text: string):
  | { ok: true; rows: Record<string, string>[] }
  | { ok: false; error: string } {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const fatal = parsed.errors.find(
    (e) => e.type === "Quotes" || e.type === "Delimiter",
  );
  if (fatal) {
    return { ok: false, error: fatal.message ?? "Invalid CSV." };
  }
  const rows = parsed.data.filter((r) =>
    Object.values(r).some((v) => String(v ?? "").trim() !== ""),
  );
  return { ok: true, rows };
}
