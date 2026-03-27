"use server";

import { randomUUID } from "crypto";
import { asc, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { deliveryMethods, records } from "@/db/schema";
import { formatZodError } from "@/lib/format-zod-error";
import { requireManager } from "@/lib/permissions";

export type DeliveryMethodListRow = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const codeField = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(
    /^[a-z0-9_]+$/,
    "Use lowercase letters, numbers, and underscores only.",
  );

const createSchema = z.object({
  code: codeField,
  name: z.string().trim().min(1).max(200),
  sortOrder: z.coerce.number().int().min(0).max(99999),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  code: codeField.optional(),
  name: z.string().trim().min(1).max(200).optional(),
  sortOrder: z.coerce.number().int().min(0).max(99999).optional(),
  isActive: z.boolean().optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

function toPublic(row: typeof deliveryMethods.$inferSelect): DeliveryMethodListRow {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function isCodeTakenByOther(
  db: ReturnType<typeof getDb>,
  code: string,
  excludeId?: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: deliveryMethods.id })
    .from(deliveryMethods)
    .where(eq(deliveryMethods.code, code))
    .limit(1);
  if (!row) return false;
  if (excludeId && row.id === excludeId) return false;
  return true;
}

/** Paginated delivery methods for Settings (manager-only). */
export async function getDeliveryMethodsPage(params: {
  page: number;
  pageSize: number;
}): Promise<{ rows: DeliveryMethodListRow[]; total: number }> {
  await requireManager();
  const db = getDb();
  const page = Math.max(1, params.page);
  const pageSize = Math.min(50, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;

  const [tot] = await db.select({ c: count() }).from(deliveryMethods);
  const total = Number(tot?.c ?? 0);

  const raw = await db
    .select()
    .from(deliveryMethods)
    .orderBy(asc(deliveryMethods.sortOrder), asc(deliveryMethods.name))
    .limit(pageSize)
    .offset(offset);

  return {
    total,
    rows: raw.map(toPublic),
  };
}

export async function createDeliveryMethodAction(input: unknown) {
  await requireManager();
  const parsedResult = createSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: formatZodError(parsedResult.error) };
  }
  const parsed = parsedResult.data;
  const db = getDb();
  if (await isCodeTakenByOther(db, parsed.code)) {
    return { ok: false as const, error: "Code is already in use." };
  }
  await db.insert(deliveryMethods).values({
    id: randomUUID(),
    code: parsed.code,
    name: parsed.name,
    sortOrder: parsed.sortOrder,
    isActive: parsed.isActive ?? true,
  });
  revalidatePath("/settings/delivery-methods");
  revalidatePath("/records");
  revalidatePath("/records/new");
  return { ok: true as const };
}

export async function updateDeliveryMethodAction(input: unknown) {
  await requireManager();
  const parsedResult = updateSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: formatZodError(parsedResult.error) };
  }
  const parsed = parsedResult.data;
  if (
    parsed.code === undefined &&
    parsed.name === undefined &&
    parsed.sortOrder === undefined &&
    parsed.isActive === undefined
  ) {
    return { ok: false as const, error: "Nothing to update." };
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(deliveryMethods)
    .where(eq(deliveryMethods.id, parsed.id))
    .limit(1);
  if (!row) {
    return { ok: false as const, error: "Delivery method not found." };
  }
  if (parsed.code !== undefined) {
    if (await isCodeTakenByOther(db, parsed.code, parsed.id)) {
      return { ok: false as const, error: "Code is already in use." };
    }
  }
  const patch: Partial<typeof deliveryMethods.$inferInsert> = {};
  if (parsed.code !== undefined) patch.code = parsed.code;
  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.sortOrder !== undefined) patch.sortOrder = parsed.sortOrder;
  if (parsed.isActive !== undefined) patch.isActive = parsed.isActive;
  await db
    .update(deliveryMethods)
    .set(patch)
    .where(eq(deliveryMethods.id, parsed.id));
  revalidatePath("/settings/delivery-methods");
  revalidatePath("/records");
  revalidatePath("/records/new");
  return { ok: true as const };
}

export type DeleteDeliveryMethodResult =
  | { ok: true }
  | { ok: false; error: string; code?: "IN_USE" };

/** Hard delete only when no records reference this delivery method. */
export async function deleteDeliveryMethodAction(
  input: unknown,
): Promise<DeleteDeliveryMethodResult> {
  await requireManager();
  const parsedResult = idSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false, error: formatZodError(parsedResult.error) };
  }
  const { id } = parsedResult.data;
  const db = getDb();
  const [dm] = await db
    .select()
    .from(deliveryMethods)
    .where(eq(deliveryMethods.id, id))
    .limit(1);
  if (!dm) {
    return { ok: false, error: "Delivery method not found." };
  }
  const [usage] = await db
    .select({ c: count() })
    .from(records)
    .where(eq(records.deliveryMethodId, id));
  const n = Number(usage?.c ?? 0);
  if (n > 0) {
    return {
      ok: false,
      error:
        "This delivery method is assigned to one or more records. Deactivate it instead of deleting.",
      code: "IN_USE",
    };
  }
  await db.delete(deliveryMethods).where(eq(deliveryMethods.id, id));
  revalidatePath("/settings/delivery-methods");
  revalidatePath("/records");
  revalidatePath("/records/new");
  return { ok: true };
}
