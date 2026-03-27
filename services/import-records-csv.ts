"use server";

import { randomUUID } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  branches,
  deliveryMethods,
  records,
  statuses,
} from "@/db/schema";
import { getRequestMetaFromHeaders, writeAuditLog } from "@/lib/audit-log";
import { ImportRowError } from "@/lib/import-csv-errors";
import type { ImportCsvResult } from "@/lib/import-csv-types";
import { validateCsvImport } from "@/lib/import-csv-validate";
import { loadRecordFieldConfig } from "@/lib/record-field-config";
import { generateNextRecordNo, type RecordNoDb } from "@/lib/record-no";
import { parseCsvKeyedRows } from "@/lib/parse-csv";
import { requireManager } from "@/lib/permissions";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 2000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Legacy CSV import (Phase E). Manager-only (`requireManager`).
 *
 * **Lookups:** `branch_id` = branch id or branch name (case-insensitive).
 * `status_id` = status id or status `code` (case-insensitive).
 * `delivery_method_id` = delivery method id or `code` (case-insensitive).
 * Only **active** branches, statuses, and delivery methods resolve.
 *
 * **Placeholders** (blank cells): `record_no` → `generateNextRecordNo`;
 * `date_received` → today (UTC); `serial_number` → `legacy-sn-<row>-<suffix>`;
 * `customer_name` → `Legacy import`; `phone_number` → `n/a`; `pc_model` → `Unknown`.
 * Required custom fields get `"legacy-import"` in `custom_data`.
 */
export async function importRecordsCsvAction(
  formData: FormData,
): Promise<ImportCsvResult> {
  const session = await requireManager();
  const userId = (session.user as { id: string }).id;

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
  const h0 = rows[0];
  if (
    !("branch_id" in h0) ||
    !("status_id" in h0) ||
    !("delivery_method_id" in h0)
  ) {
    return {
      ok: false,
      error:
        'CSV must include "branch_id", "status_id", and "delivery_method_id" columns.',
    };
  }

  const { systemVisibility, customFields } = await loadRecordFieldConfig();
  const requiredCustom: Record<string, unknown> = {};
  for (const f of customFields) {
    if (f.isRequired) requiredCustom[f.key] = "legacy-import";
  }

  const db = getDb();
  const [branchRows, statusRows, dmRows] = await Promise.all([
    db.select().from(branches).where(eq(branches.isActive, true)),
    db.select().from(statuses).where(eq(statuses.isActive, true)),
    db
      .select()
      .from(deliveryMethods)
      .where(eq(deliveryMethods.isActive, true)),
  ]);

  const branchById = new Map(branchRows.map((b) => [b.id, b.id]));
  const branchByNameLower = new Map(
    branchRows.map((b) => [b.name.trim().toLowerCase(), b.id]),
  );
  const statusById = new Map(statusRows.map((s) => [s.id, s.id]));
  const statusByCodeLower = new Map(
    statusRows.map((s) => [s.code.trim().toLowerCase(), s.id]),
  );
  const dmById = new Map(dmRows.map((d) => [d.id, d.id]));
  const dmByCodeLower = new Map(
    dmRows.map((d) => [d.code.trim().toLowerCase(), d.id]),
  );

  function resolveBranch(raw: string, rowNum: number): string {
    const t = raw.trim();
    if (!t) {
      throw new ImportRowError(`Row ${rowNum}: branch_id is required.`);
    }
    if (branchById.has(t)) return t;
    const byName = branchByNameLower.get(t.toLowerCase());
    if (byName) return byName;
    throw new ImportRowError(
      `Row ${rowNum}: unknown branch "${t}" (use id or name).`,
    );
  }

  function resolveStatus(raw: string, rowNum: number): string {
    const t = raw.trim();
    if (!t) {
      throw new ImportRowError(`Row ${rowNum}: status_id is required.`);
    }
    if (statusById.has(t)) return t;
    const byCode = statusByCodeLower.get(t.toLowerCase());
    if (byCode) return byCode;
    throw new ImportRowError(
      `Row ${rowNum}: unknown status "${t}" (use id or code).`,
    );
  }

  function resolveDelivery(raw: string, rowNum: number): string {
    const t = raw.trim();
    if (!t) {
      throw new ImportRowError(
        `Row ${rowNum}: delivery_method_id is required.`,
      );
    }
    if (dmById.has(t)) return t;
    const byCode = dmByCodeLower.get(t.toLowerCase());
    if (byCode) return byCode;
    throw new ImportRowError(
      `Row ${rowNum}: unknown delivery method "${t}" (use id or code).`,
    );
  }

  let inserted = 0;
  try {
    await db.transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        const branchId = resolveBranch(row.branch_id ?? "", rowNum);
        const statusId = resolveStatus(row.status_id ?? "", rowNum);
        const deliveryMethodId = resolveDelivery(
          row.delivery_method_id ?? "",
          rowNum,
        );

        let recordNo = (row.record_no ?? "").trim();
        if (!recordNo) {
          recordNo = await generateNextRecordNo(tx);
        } else {
          const [dup] = await tx
            .select({ id: records.id })
            .from(records)
            .where(eq(records.recordNo, recordNo))
            .limit(1);
          if (dup) {
            throw new ImportRowError(
              `Row ${rowNum}: record_no "${recordNo}" already exists.`,
            );
          }
        }

        const dateReceivedRaw = (row.date_received ?? "").trim();
        const dateReceived = dateReceivedRaw
          ? parseDateRequired(dateReceivedRaw, rowNum)
          : todayUtc();

        const dateReturnedRaw = (row.date_returned ?? "").trim();
        const dateReturned = systemVisibility.dateReturned
          ? dateReturnedRaw
            ? parseDateRequired(dateReturnedRaw, rowNum)
            : null
          : null;

        let pcModel = (row.pc_model ?? "").trim();
        if (!pcModel) pcModel = "Unknown";
        if (pcModel.length > 500) {
          throw new ImportRowError(
            `Row ${rowNum}: pc_model must be at most 500 characters.`,
          );
        }

        let serialNumber = (row.serial_number ?? "").trim();
        if (!serialNumber) {
          const suf = randomUUID().replace(/-/g, "").slice(0, 12);
          serialNumber = `legacy-sn-${rowNum}-${suf}`;
        }
        if (serialNumber.length > 500) {
          throw new ImportRowError(
            `Row ${rowNum}: serial_number must be at most 500 characters.`,
          );
        }

        const dupSerial = await findActiveSerialDuplicateTx(
          tx,
          serialNumber,
        );
        if (dupSerial) {
          throw new ImportRowError(
            `Row ${rowNum}: serial number already used on ${dupSerial.recordNo}.`,
          );
        }

        let tagNumber: string | null = null;
        if (systemVisibility.tagNumber) {
          const tr = (row.tag_number ?? "").trim();
          tagNumber = tr || null;
          if (tagNumber) {
            const dupTag = await findActiveTagDuplicateTx(tx, tagNumber);
            if (dupTag) {
              throw new ImportRowError(
                `Row ${rowNum}: tag number already used on ${dupTag.recordNo}.`,
              );
            }
          }
        }

        let maintenanceNote: string | null = null;
        if (systemVisibility.maintenanceNote) {
          const m = (row.maintenance_note ?? "").trim();
          maintenanceNote = m || null;
        }

        let customerName = (row.customer_name ?? "").trim();
        if (!customerName) customerName = "Legacy import";
        if (customerName.length > 500) {
          throw new ImportRowError(
            `Row ${rowNum}: customer_name must be at most 500 characters.`,
          );
        }

        let phoneNumber = (row.phone_number ?? "").trim();
        if (!phoneNumber) phoneNumber = "n/a";
        if (phoneNumber.length > 80) {
          throw new ImportRowError(
            `Row ${rowNum}: phone_number must be at most 80 characters.`,
          );
        }

        const id = randomUUID();
        await tx.insert(records).values({
          id,
          recordNo,
          dateReceived,
          dateReturned,
          branchId,
          pcModel,
          serialNumber,
          tagNumber,
          maintenanceNote,
          customerName,
          phoneNumber,
          statusId,
          deliveryMethodId,
          customData: { ...requiredCustom } as Record<string, unknown>,
          createdBy: userId,
          updatedBy: userId,
        });
        inserted++;
      }
    });
  } catch (e) {
    if (e instanceof ImportRowError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }

  revalidatePath("/records");
  revalidatePath("/");

  const meta = await getRequestMetaFromHeaders();
  await writeAuditLog({
    eventType: "record_bulk_import",
    actorUserId: userId,
    entityType: "record",
    route: "/records",
    httpMethod: "POST",
    metadata: { rowsImported: inserted },
    ...meta,
  });

  return {
    ok: true,
    message: `${inserted} record${inserted === 1 ? "" : "s"} imported.`,
  };
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDateRequired(raw: string, rowNum: number): string {
  const t = raw.trim();
  if (!DATE_RE.test(t)) {
    throw new ImportRowError(
      `Row ${rowNum}: date must be YYYY-MM-DD.`,
    );
  }
  return t;
}

async function findActiveSerialDuplicateTx(
  tx: RecordNoDb,
  serial: string,
): Promise<{ recordNo: string } | null> {
  const [row] = await tx
    .select({ recordNo: records.recordNo })
    .from(records)
    .where(and(eq(records.serialNumber, serial), isNull(records.deletedAt)))
    .limit(1);
  return row ?? null;
}

async function findActiveTagDuplicateTx(
  tx: RecordNoDb,
  tag: string,
): Promise<{ recordNo: string } | null> {
  const [row] = await tx
    .select({ recordNo: records.recordNo })
    .from(records)
    .where(and(eq(records.tagNumber, tag), isNull(records.deletedAt)))
    .limit(1);
  return row ?? null;
}
