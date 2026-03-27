"use client";

import { importBranchesCsvAction } from "@/services/import-branches-csv";

export async function importBranchesCsvFromFile(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return importBranchesCsvAction(fd);
}
