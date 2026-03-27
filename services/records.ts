"use server";

import { randomUUID } from "crypto";
import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { branches, deliveryMethods, records, statuses } from "@/db/schema";
import { getRequestMetaFromHeaders, writeAuditLog } from "@/lib/audit-log";
import { formatZodError } from "@/lib/format-zod-error";
import { loadRecordFieldConfig } from "@/lib/record-field-config";
import {
  recordFieldsSchema,
  updateRecordPayloadSchema,
} from "@/lib/record-payload-schema";
import { generateNextRecordNo } from "@/lib/record-no";
import { requireAuth, requireManager } from "@/lib/permissions";
import { z } from "zod";

/** Other **active** (non-archived) rows only; same serial/tag allowed again after archive. */
async function findActiveSerialDuplicate(
  serial: string,
  excludeRecordId?: string,
) {
  const db = getDb();
  const parts = [eq(records.serialNumber, serial), isNull(records.deletedAt)];
  if (excludeRecordId) {
    parts.push(ne(records.id, excludeRecordId));
  }
  const [row] = await db
    .select({ recordNo: records.recordNo })
    .from(records)
    .where(and(...parts))
    .limit(1);
  return row ?? null;
}

async function findActiveTagDuplicate(tag: string, excludeRecordId?: string) {
  const db = getDb();
  const parts = [eq(records.tagNumber, tag), isNull(records.deletedAt)];
  if (excludeRecordId) {
    parts.push(ne(records.id, excludeRecordId));
  }
  const [row] = await db
    .select({ recordNo: records.recordNo })
    .from(records)
    .where(and(...parts))
    .limit(1);
  return row ?? null;
}

export async function fetchRecordLookups() {
  await requireAuth();
  const db = getDb();
  const [b, s, d] = await Promise.all([
    db.select().from(branches).where(eq(branches.isActive, true)),
    db
      .select()
      .from(statuses)
      .where(eq(statuses.isActive, true))
      .orderBy(asc(statuses.sortOrder), asc(statuses.name)),
    db
      .select()
      .from(deliveryMethods)
      .where(eq(deliveryMethods.isActive, true))
      .orderBy(asc(deliveryMethods.sortOrder), asc(deliveryMethods.name)),
  ]);
  b.sort((a, x) => a.name.localeCompare(x.name));
  return { branches: b, statuses: s, deliveryMethods: d };
}

export async function createRecordAction(input: unknown) {
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  const parsedResult = recordFieldsSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: formatZodError(parsedResult.error) };
  }
  const parsed = parsedResult.data;
  const { systemVisibility, customFields } = await loadRecordFieldConfig();
  for (const f of customFields) {
    if (!f.isRequired) continue;
    const v = parsed.customData?.[f.key];
    if (v === undefined || v === null || String(v).trim() === "") {
      return { ok: false as const, error: `${f.label} is required.` };
    }
  }
  const dupSerial = await findActiveSerialDuplicate(
    parsed.serialNumber.trim(),
  );
  if (dupSerial) {
    return {
      ok: false as const,
      error: `Serial number already used on ${dupSerial.recordNo}.`,
    };
  }
  const tagTrim = parsed.tagNumber?.trim();
  if (systemVisibility.tagNumber && tagTrim) {
    const dupTag = await findActiveTagDuplicate(tagTrim);
    if (dupTag) {
      return {
        ok: false as const,
        error: `Tag number already used on ${dupTag.recordNo}.`,
      };
    }
  }
  const id = randomUUID();
  const recordNo = await generateNextRecordNo();
  const db = getDb();
  const tagNumber = systemVisibility.tagNumber
    ? (parsed.tagNumber?.trim() || null)
    : null;
  const maintenanceNote = systemVisibility.maintenanceNote
    ? (parsed.maintenanceNote?.trim() || null)
    : null;
  const dateReturned = systemVisibility.dateReturned
    ? (parsed.dateReturned ?? null)
    : null;
  await db.insert(records).values({
    id,
    recordNo,
    dateReceived: parsed.dateReceived,
    dateReturned,
    branchId: parsed.branchId,
    pcModel: parsed.pcModel.trim(),
    serialNumber: parsed.serialNumber.trim(),
    tagNumber,
    maintenanceNote,
    customerName: parsed.customerName.trim(),
    phoneNumber: parsed.phoneNumber.trim(),
    statusId: parsed.statusId,
    deliveryMethodId: parsed.deliveryMethodId,
    customData: (parsed.customData ?? {}) as Record<string, unknown>,
    createdBy: userId,
    updatedBy: userId,
  });
  const meta = await getRequestMetaFromHeaders();
  await writeAuditLog({
    eventType: "record_create",
    actorUserId: userId,
    entityType: "record",
    entityId: id,
    route: "/records/new",
    httpMethod: "POST",
    ...meta,
    afterSnapshot: {
      recordNo,
      customerName: parsed.customerName.trim(),
      serialNumber: parsed.serialNumber.trim(),
    },
  });
  revalidatePath("/records");
  revalidatePath("/");
  return { ok: true as const, recordId: id };
}

export async function updateRecordAction(input: unknown) {
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const parsedResult = updateRecordPayloadSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: formatZodError(parsedResult.error) };
  }
  const parsed = parsedResult.data;
  const db = getDb();
  const [existing] = await db
    .select()
    .from(records)
    .where(eq(records.id, parsed.recordId))
    .limit(1);
  if (!existing || existing.deletedAt) {
    return { ok: false as const, error: "Record not found." };
  }
  if (role !== "manager" && existing.createdBy !== userId) {
    return { ok: false as const, error: "You cannot edit this record." };
  }
  const dupSerial = await findActiveSerialDuplicate(
    parsed.serialNumber.trim(),
    parsed.recordId,
  );
  if (dupSerial) {
    return {
      ok: false as const,
      error: `Serial number already used on ${dupSerial.recordNo}.`,
    };
  }
  const { systemVisibility, customFields } = await loadRecordFieldConfig();
  for (const f of customFields) {
    if (!f.isRequired) continue;
    const merged = {
      ...((existing.customData as Record<string, unknown>) ?? {}),
      ...(parsed.customData ?? {}),
    };
    const v = merged[f.key];
    if (v === undefined || v === null || String(v).trim() === "") {
      return { ok: false as const, error: `${f.label} is required.` };
    }
  }
  const tagTrim = parsed.tagNumber?.trim();
  if (systemVisibility.tagNumber && tagTrim) {
    const dupTag = await findActiveTagDuplicate(tagTrim, parsed.recordId);
    if (dupTag) {
      return {
        ok: false as const,
        error: `Tag number already used on ${dupTag.recordNo}.`,
      };
    }
  }
  const tagNumber = systemVisibility.tagNumber
    ? (parsed.tagNumber?.trim() || null)
    : existing.tagNumber;
  const maintenanceNote = systemVisibility.maintenanceNote
    ? (parsed.maintenanceNote?.trim() || null)
    : existing.maintenanceNote;
  const dateReturned = systemVisibility.dateReturned
    ? (parsed.dateReturned ?? null)
    : existing.dateReturned;
  const nextCustom = {
    ...((existing.customData as Record<string, unknown>) ?? {}),
    ...(parsed.customData ?? {}),
  };
  const beforeSnapshot = {
    dateReceived: existing.dateReceived,
    dateReturned: existing.dateReturned,
    branchId: existing.branchId,
    pcModel: existing.pcModel,
    serialNumber: existing.serialNumber,
    customerName: existing.customerName,
    phoneNumber: existing.phoneNumber,
    statusId: existing.statusId,
    deliveryMethodId: existing.deliveryMethodId,
  };
  await db
    .update(records)
    .set({
      dateReceived: parsed.dateReceived,
      dateReturned,
      branchId: parsed.branchId,
      pcModel: parsed.pcModel.trim(),
      serialNumber: parsed.serialNumber.trim(),
      tagNumber,
      maintenanceNote,
      customerName: parsed.customerName.trim(),
      phoneNumber: parsed.phoneNumber.trim(),
      statusId: parsed.statusId,
      deliveryMethodId: parsed.deliveryMethodId,
      customData: nextCustom,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(records.id, parsed.recordId));
  const meta = await getRequestMetaFromHeaders();
  await writeAuditLog({
    eventType: "record_update",
    actorUserId: userId,
    entityType: "record",
    entityId: parsed.recordId,
    route: `/records/${parsed.recordId}/edit`,
    httpMethod: "POST",
    ...meta,
    beforeSnapshot,
    afterSnapshot: {
      dateReceived: parsed.dateReceived,
      dateReturned: dateReturned ?? null,
      branchId: parsed.branchId,
      pcModel: parsed.pcModel.trim(),
      serialNumber: parsed.serialNumber.trim(),
      customerName: parsed.customerName.trim(),
      phoneNumber: parsed.phoneNumber.trim(),
      statusId: parsed.statusId,
      deliveryMethodId: parsed.deliveryMethodId,
    },
  });
  revalidatePath("/records");
  revalidatePath(`/records/${parsed.recordId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function archiveRecordAction(input: unknown) {
  const session = await requireManager();
  const actorId = (session.user as { id: string }).id;
  const idResult = z.object({ recordId: z.string().min(1) }).safeParse(input);
  if (!idResult.success) {
    return { ok: false as const, error: formatZodError(idResult.error) };
  }
  const { recordId } = idResult.data;
  const db = getDb();
  const [existing] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);
  if (!existing || existing.deletedAt) {
    return { ok: false as const, error: "Record not found." };
  }
  const deletedAt = new Date();
  await db
    .update(records)
    .set({ deletedAt, updatedAt: new Date() })
    .where(eq(records.id, recordId));
  const meta = await getRequestMetaFromHeaders();
  await writeAuditLog({
    eventType: "record_archive",
    actorUserId: actorId,
    entityType: "record",
    entityId: recordId,
    route: "/records",
    httpMethod: "POST",
    ...meta,
    beforeSnapshot: { recordNo: existing.recordNo, deletedAt: null },
    afterSnapshot: { recordNo: existing.recordNo, deletedAt: deletedAt.toISOString() },
  });
  revalidatePath("/records");
  revalidatePath(`/records/${recordId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function restoreRecordAction(input: unknown) {
  const session = await requireManager();
  const actorId = (session.user as { id: string }).id;
  const idResult = z.object({ recordId: z.string().min(1) }).safeParse(input);
  if (!idResult.success) {
    return { ok: false as const, error: formatZodError(idResult.error) };
  }
  const { recordId } = idResult.data;
  const db = getDb();
  const [existing] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);
  if (!existing || !existing.deletedAt) {
    return { ok: false as const, error: "Record not found or not archived." };
  }
  const prevDeleted = existing.deletedAt.toISOString();
  await db
    .update(records)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(records.id, recordId));
  const meta = await getRequestMetaFromHeaders();
  await writeAuditLog({
    eventType: "record_restore",
    actorUserId: actorId,
    entityType: "record",
    entityId: recordId,
    route: `/records/${recordId}`,
    httpMethod: "POST",
    ...meta,
    beforeSnapshot: { recordNo: existing.recordNo, deletedAt: prevDeleted },
    afterSnapshot: { recordNo: existing.recordNo, deletedAt: null },
  });
  revalidatePath("/records");
  revalidatePath(`/records/${recordId}`);
  revalidatePath("/");
  return { ok: true as const };
}
