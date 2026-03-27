/** Result of a CSV import attempt (client callback or server action). */
export type ImportCsvResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };
