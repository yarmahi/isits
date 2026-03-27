/** Result of a CSV import attempt (client callback or server action). */
export type ImportCsvResult =
  | { ok: true }
  | { ok: false; error: string };
