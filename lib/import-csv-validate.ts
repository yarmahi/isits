import type { ImportCsvResult } from "@/lib/import-csv-types";

/** Phase A: extension + non-empty file; Phase B+ adds parsing and row rules. */
export function validateCsvImport(fileName: string, text: string): ImportCsvResult {
  if (!fileName.toLowerCase().endsWith(".csv")) {
    return { ok: false, error: "Choose a .csv file." };
  }
  if (!text.trim()) {
    return { ok: false, error: "File is empty." };
  }
  return { ok: true };
}
