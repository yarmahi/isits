"use client";

import { importRecordsCsvAction } from "@/services/import-records-csv";

export async function importRecordsCsvFromFile(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return importRecordsCsvAction(fd);
}
