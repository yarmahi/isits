import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { desc, like } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { records } from "@/db/schema";

/** DB or transaction — same query surface as `getDb()` for reads used here. */
export type RecordNoDb =
  | ReturnType<typeof getDb>
  | PgTransaction<
      NodePgQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;

/** Human-readable ids: ITR-YYYY-NNNN (per calendar year). */
export async function generateNextRecordNo(
  db: RecordNoDb = getDb(),
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ITR-${year}-`;
  const rows = await db
    .select({ recordNo: records.recordNo })
    .from(records)
    .where(like(records.recordNo, `${prefix}%`))
    .orderBy(desc(records.recordNo))
    .limit(1);
  const last = rows[0]?.recordNo;
  let next = 1;
  if (last) {
    const part = last.slice(prefix.length);
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}
