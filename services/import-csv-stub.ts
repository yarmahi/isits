"use server";

import { validateCsvImport } from "@/lib/import-csv-validate";
import type { ImportCsvResult } from "@/lib/import-csv-types";

/** Phase A stub: same checks as client; Phase B+ replaces with real imports. */
export async function stubImportCsvAction(
  formData: FormData,
): Promise<ImportCsvResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file uploaded." };
  }
  const text = await file.text();
  return validateCsvImport(file.name, text);
}
