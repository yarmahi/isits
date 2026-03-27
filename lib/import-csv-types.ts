/** Row-level failure (CSV row number = header + data row index, 2-based). */
export type CsvRowFailure = { row: number; reason: string };

/** Result of a CSV import attempt (client callback or server action). */
export type ImportCsvResult =
  | { ok: true; message?: string; rowFailures?: CsvRowFailure[] }
  | { ok: false; error: string };
