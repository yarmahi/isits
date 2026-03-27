"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { branches } from "@/db/schema";
import type { ImportCsvResult } from "@/lib/import-csv-types";
import { validateCsvImport } from "@/lib/import-csv-validate";
import { parseCsvKeyedRows } from "@/lib/parse-csv";
import { requireManager } from "@/lib/permissions";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;

class ImportRowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportRowError";
  }
}

/**
 * Branches CSV import policy (Phase B):
 * - Columns: `name` (required), `is_active` (optional, default true), `id` (optional UUID).
 * - Duplicate names in the same file (case-insensitive): later rows skipped.
 * - Name already in DB (case-insensitive) and row has no `id` matching that branch: skipped.
 * - Row with `id`: update if id exists; insert with that id if new. Name must not belong to another branch.
 */
export async function importBranchesCsvAction(
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
  if (text.length > MAX_BYTES) {
    return { ok: false, error: "File too large (max 2 MB)." };
  }

  const parsed = parseCsvKeyedRows(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const { rows } = parsed;
  if (rows.length === 0) {
    return { ok: false, error: "No data rows in CSV." };
  }
  if (rows.length > MAX_ROWS) {
    return { ok: false, error: `Too many rows (max ${MAX_ROWS}).` };
  }
  if (!("name" in rows[0])) {
    return { ok: false, error: 'CSV must include a "name" column.' };
  }

  const db = getDb();
  let result: { inserted: number; updated: number; skipped: number };
  try {
    result = await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: branches.id, name: branches.name })
        .from(branches);

      const idSet = new Set(existing.map((e) => e.id));
      const nameLowerToId = new Map<string, string>();
      for (const e of existing) {
        nameLowerToId.set(e.name.trim().toLowerCase(), e.id);
      }

      function forgetId(id: string) {
        for (const [k, v] of [...nameLowerToId.entries()]) {
          if (v === id) nameLowerToId.delete(k);
        }
      }

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const seenNameInFile = new Set<string>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const nameRaw = (row.name ?? "").trim();
        if (!nameRaw) {
          skipped++;
          continue;
        }
        if (nameRaw.length > 200) {
          throw new ImportRowError(
            `Row ${rowNum}: name must be 1–200 characters.`,
          );
        }
        const nameKey = nameRaw.toLowerCase();
        if (seenNameInFile.has(nameKey)) {
          skipped++;
          continue;
        }

        const boolParsed = parseBool(row.is_active, rowNum);
        if (!boolParsed.ok) {
          throw new ImportRowError(boolParsed.error);
        }
        const isActive = boolParsed.value;

        const idRaw = (row.id ?? "").trim();
        if (idRaw) {
          if (!z.string().uuid().safeParse(idRaw).success) {
            throw new ImportRowError(
              `Row ${rowNum}: id must be a valid UUID.`,
            );
          }
          const owner = nameLowerToId.get(nameKey);
          if (owner !== undefined && owner !== idRaw) {
            skipped++;
            continue;
          }

          const existed = idSet.has(idRaw);
          forgetId(idRaw);

          if (existed) {
            await tx
              .update(branches)
              .set({
                name: nameRaw,
                isActive,
                updatedAt: new Date(),
              })
              .where(eq(branches.id, idRaw));
            updated++;
          } else {
            await tx.insert(branches).values({
              id: idRaw,
              name: nameRaw,
              isActive,
            });
            inserted++;
            idSet.add(idRaw);
          }
          nameLowerToId.set(nameKey, idRaw);
          seenNameInFile.add(nameKey);
        } else {
          if (nameLowerToId.has(nameKey)) {
            skipped++;
            continue;
          }
          const newId = randomUUID();
          await tx.insert(branches).values({
            id: newId,
            name: nameRaw,
            isActive,
          });
          inserted++;
          idSet.add(newId);
          nameLowerToId.set(nameKey, newId);
          seenNameInFile.add(nameKey);
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

  revalidatePath("/settings/branches");
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

function parseBool(
  raw: string | undefined,
  rowNum: number,
): { ok: true; value: boolean } | { ok: false; error: string } {
  if (raw === undefined || raw.trim() === "") {
    return { ok: true, value: true };
  }
  const s = raw.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(s)) return { ok: true, value: true };
  if (["false", "0", "no", "n"].includes(s)) return { ok: true, value: false };
  return { ok: false, error: `Row ${rowNum}: invalid is_active (use true/false).` };
}
