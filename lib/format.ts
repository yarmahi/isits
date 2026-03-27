/** Format Postgres `date` or ISO date string for display. */
export function formatRecordDate(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === "") return "—";
  const s = typeof value === "string" ? value : value.toISOString().slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
