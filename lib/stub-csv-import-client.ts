"use client";

import { stubImportCsvAction } from "@/services/import-csv-stub";

/** Client → server (FormData) for Phase A stub; swap handler per entity in later phases. */
export async function stubCsvImportFromFile(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return stubImportCsvAction(fd);
}
