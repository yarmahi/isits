"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { statuses } from "@/db/schema";
import { ImportRowError } from "@/lib/import-csv-errors";
import {
  parseBool,
  parseCodeField,
  parseSortOrder,
} from "@/lib/import-csv-parse";
import type { ImportCsvResult } from "@/lib/import-csv-types";
import {
  IMPORT_CSV_MAX_BYTES,
  IMPORT_CSV_MAX_ROWS_LOOKUP,
} from "@/lib/import-csv-limits";
import { validateCsvImport } from "@/lib/import-csv-validate";
import { parseCsvKeyedRows } from "@/lib/parse-csv";
import { requireManager } from "@/lib/permissions";
const CODE_RE = /^[a-z0-9_]+$/;

/**
 * Statuses CSV import (Phase C). Unique key: `code` (DB unique).
 * - Optional `id` (UUID): update existing or insert with that id.
 * - Duplicate `code` in file (same normalized code): later rows skipped.
 * - `code` already used by another status and row does not target that id: skipped.
 */
export async function importStatusesCsvAction(
  formData: FormData,
): Promise<ImportCsvResult> {
  await requireManager();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file uploaded." };
  }
  const text = await file.text();
  const pre = validateCsvImport(file.name, text);
  if (!pre.ok) return pre;
  if (text.length > IMPORT_CSV_MAX_BYTES) {
    return { ok: false, error: "File too large (max 2 MB)." };
  }

  const parsed = parseCsvKeyedRows(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const { rows } = parsed;
  if (rows.length === 0) {
    return { ok: false, error: "No data rows in CSV." };
  }
  if (rows.length > IMPORT_CSV_MAX_ROWS_LOOKUP) {
    return {
      ok: false,
      error: `Too many rows (max ${IMPORT_CSV_MAX_ROWS_LOOKUP}).`,
    };
  }
  if (!("code" in rows[0]) || !("name" in rows[0])) {
    return {
      ok: false,
      error: 'CSV must include "code" and "name" columns.',
    };
  }

  const db = getDb();
  let result: { inserted: number; updated: number; skipped: number };
  try {
    result = await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: statuses.id, code: statuses.code })
        .from(statuses);

      const idSet = new Set(existing.map((e) => e.id));
      const codeKeyToId = new Map<string, string>();
      for (const e of existing) {
        codeKeyToId.set(e.code.trim().toLowerCase(), e.id);
      }

      function forgetId(id: string) {
        for (const [k, v] of [...codeKeyToId.entries()]) {
          if (v === id) codeKeyToId.delete(k);
        }
      }

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const seenCodeInFile = new Set<string>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const codeRaw = (row.code ?? "").trim();
        if (!codeRaw) {
          skipped++;
          continue;
        }
        const code = parseCodeField(codeRaw, rowNum);
        const codeKey = code.toLowerCase();
        if (seenCodeInFile.has(codeKey)) {
          skipped++;
          continue;
        }

        const nameRaw = (row.name ?? "").trim();
        if (!nameRaw) {
          throw new ImportRowError(`Row ${rowNum}: name is required.`);
        }
        if (nameRaw.length > 200) {
          throw new ImportRowError(
            `Row ${rowNum}: name must be 1–200 characters.`,
          );
        }

        const sortOrder = parseSortOrder(row.sort_order, rowNum, 0);
        const boolParsed = parseBool(row.is_active, rowNum);
        if (!boolParsed.ok) throw new ImportRowError(boolParsed.error);
        const isActive = boolParsed.value;

        const idRaw = (row.id ?? "").trim();
        if (idRaw) {
          if (!z.string().uuid().safeParse(idRaw).success) {
            throw new ImportRowError(
              `Row ${rowNum}: id must be a valid UUID.`,
            );
          }
          const owner = codeKeyToId.get(codeKey);
          if (owner !== undefined && owner !== idRaw) {
            skipped++;
            continue;
          }

          const existed = idSet.has(idRaw);
          forgetId(idRaw);

          if (existed) {
            await tx
              .update(statuses)
              .set({
                code,
                name: nameRaw,
                sortOrder,
                isActive,
              })
              .where(eq(statuses.id, idRaw));
            updated++;
          } else {
            await tx.insert(statuses).values({
              id: idRaw,
              code,
              name: nameRaw,
              sortOrder,
              isActive,
            });
            inserted++;
            idSet.add(idRaw);
          }
          codeKeyToId.set(codeKey, idRaw);
          seenCodeInFile.add(codeKey);
        } else {
          if (codeKeyToId.has(codeKey)) {
            skipped++;
            continue;
          }
          const newId = randomUUID();
          await tx.insert(statuses).values({
            id: newId,
            code,
            name: nameRaw,
            sortOrder,
            isActive,
          });
          inserted++;
          idSet.add(newId);
          codeKeyToId.set(codeKey, newId);
          seenCodeInFile.add(codeKey);
        }
      }

      return { inserted, updated, skipped };
    });
  } catch (e) {
    if (e instanceof ImportRowError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }

  revalidatePath("/settings/statuses");
  revalidatePath("/records");
  revalidatePath("/records/new");

  const parts: string[] = [];
  if (result.inserted) parts.push(`${result.inserted} added`);
  if (result.updated) parts.push(`${result.updated} updated`);
  if (result.skipped) parts.push(`${result.skipped} skipped`);
  const message =
    parts.length > 0 ? parts.join(", ") : "No rows changed (all skipped).";

  return { ok: true, message };
}
