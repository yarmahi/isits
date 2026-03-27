"use server";

import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { branches, deliveryMethods, records, statuses } from "@/db/schema";
import { generateNextRecordNo } from "@/lib/record-no";
import { requireAuth, requireManager } from "@/lib/permissions";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalDateStr = z
  .union([z.literal(""), dateStr])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

const recordFieldsSchema = z.object({
  dateReceived: dateStr,
  dateReturned: optionalDateStr,
  branchId: z.string().min(1),
  pcModel: z.string().min(1).max(500),
  serialNumber: z.string().min(1).max(500),
  tagNumber: z.string().max(500).optional(),
  maintenanceNote: z.string().max(10000).optional(),
  customerName: z.string().min(1).max(500),
  phoneNumber: z.string().min(1).max(80),
  statusId: z.string().min(1),
  deliveryMethodId: z.string().min(1),
});

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
  const parsed = recordFieldsSchema.parse(input);
  const id = randomUUID();
  const recordNo = await generateNextRecordNo();
  const db = getDb();
  await db.insert(records).values({
    id,
    recordNo,
    dateReceived: parsed.dateReceived,
    dateReturned: parsed.dateReturned ?? null,
    branchId: parsed.branchId,
    pcModel: parsed.pcModel.trim(),
    serialNumber: parsed.serialNumber.trim(),
    tagNumber: parsed.tagNumber?.trim() || null,
    maintenanceNote: parsed.maintenanceNote?.trim() || null,
    customerName: parsed.customerName.trim(),
    phoneNumber: parsed.phoneNumber.trim(),
    statusId: parsed.statusId,
    deliveryMethodId: parsed.deliveryMethodId,
    customData: {},
    createdBy: userId,
    updatedBy: userId,
  });
  revalidatePath("/records");
  revalidatePath("/");
  return { ok: true as const, recordId: id };
}

const updateSchema = recordFieldsSchema.extend({
  recordId: z.string().min(1),
});

export async function updateRecordAction(input: unknown) {
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const parsed = updateSchema.parse(input);
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
  await db
    .update(records)
    .set({
      dateReceived: parsed.dateReceived,
      dateReturned: parsed.dateReturned ?? null,
      branchId: parsed.branchId,
      pcModel: parsed.pcModel.trim(),
      serialNumber: parsed.serialNumber.trim(),
      tagNumber: parsed.tagNumber?.trim() || null,
      maintenanceNote: parsed.maintenanceNote?.trim() || null,
      customerName: parsed.customerName.trim(),
      phoneNumber: parsed.phoneNumber.trim(),
      statusId: parsed.statusId,
      deliveryMethodId: parsed.deliveryMethodId,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(records.id, parsed.recordId));
  revalidatePath("/records");
  revalidatePath(`/records/${parsed.recordId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function archiveRecordAction(input: unknown) {
  await requireManager();
  const { recordId } = z.object({ recordId: z.string().min(1) }).parse(input);
  const db = getDb();
  const [existing] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);
  if (!existing || existing.deletedAt) {
    return { ok: false as const, error: "Record not found." };
  }
  await db
    .update(records)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(records.id, recordId));
  revalidatePath("/records");
  revalidatePath(`/records/${recordId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function restoreRecordAction(input: unknown) {
  await requireManager();
  const { recordId } = z.object({ recordId: z.string().min(1) }).parse(input);
  const db = getDb();
  const [existing] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .limit(1);
  if (!existing || !existing.deletedAt) {
    return { ok: false as const, error: "Record not found or not archived." };
  }
  await db
    .update(records)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(records.id, recordId));
  revalidatePath("/records");
  revalidatePath(`/records/${recordId}`);
  revalidatePath("/");
  return { ok: true as const };
}
