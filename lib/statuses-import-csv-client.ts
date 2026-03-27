"use client";

import { importStatusesCsvAction } from "@/services/import-statuses-csv";

export async function importStatusesCsvFromFile(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return importStatusesCsvAction(fd);
}
