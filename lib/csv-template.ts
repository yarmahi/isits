/** Minimal CSV building for downloadable templates (Chapter 3). */

function escapeCsvField(raw: string): string {
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/** One row = one record; builds RFC-style CSV with CRLF line endings. */
export function buildCsvContent(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((r) => r.map(escapeCsvField).join(",")),
  ];
  return `${lines.join("\r\n")}\r\n`;
}
