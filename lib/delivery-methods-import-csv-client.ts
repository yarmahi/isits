"use client";

import { importDeliveryMethodsCsvAction } from "@/services/import-delivery-methods-csv";

export async function importDeliveryMethodsCsvFromFile(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return importDeliveryMethodsCsvAction(fd);
}
