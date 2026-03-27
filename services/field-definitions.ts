"use server";

import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { fieldDefinitions } from "@/db/schema";
import { formatZodError } from "@/lib/format-zod-error";
import { requireManager } from "@/lib/permissions";

const FIELD_TYPES = z.enum(["text", "textarea", "number", "date", "select"]);

function slugKey(label: string) {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 40);
  return base.startsWith("custom_") ? base : `custom_${base || "field"}`;
}

const updateSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  searchable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  label: z.string().min(1).max(200).optional(),
  selectOptions: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});

const createSchema = z.object({
  label: z.string().min(1).max(200),
  fieldType: FIELD_TYPES,
  selectOptions: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});

export async function updateFieldDefinitionAction(input: unknown) {
  await requireManager();
  const parsedResult = updateSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: formatZodError(parsedResult.error) };
  }
  const parsed = parsedResult.data;
  const db = getDb();
  const [row] = await db
    .select()
    .from(fieldDefinitions)
    .where(eq(fieldDefinitions.id, parsed.id))
    .limit(1);
  if (!row) {
    return { ok: false as const, error: "Field not found." };
  }
  const patch: Partial<typeof fieldDefinitions.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.isActive !== undefined) patch.isActive = parsed.isActive;
  if (parsed.isRequired !== undefined) patch.isRequired = parsed.isRequired;
  if (parsed.searchable !== undefined) patch.searchable = parsed.searchable;
  if (parsed.filterable !== undefined) patch.filterable = parsed.filterable;
  if (parsed.sortOrder !== undefined) patch.sortOrder = parsed.sortOrder;
  if (parsed.label !== undefined) patch.label = parsed.label.trim();
  if (parsed.selectOptions !== undefined) patch.selectOptions = parsed.selectOptions;
  if (!row.isCustom && parsed.isRequired === true) {
    return { ok: false as const, error: "System fields cannot be required here." };
  }
  await db
    .update(fieldDefinitions)
    .set(patch)
    .where(eq(fieldDefinitions.id, parsed.id));
  revalidatePath("/settings/fields");
  revalidatePath("/records");
  revalidatePath("/records/new");
  return { ok: true as const };
}

export async function createCustomFieldAction(input: unknown) {
  await requireManager();
  const parsedResult = createSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: formatZodError(parsedResult.error) };
  }
  const parsed = parsedResult.data;
  const db = getDb();
  let key = slugKey(parsed.label);
  for (let i = 0; i < 20; i++) {
    const [exists] = await db
      .select({ id: fieldDefinitions.id })
      .from(fieldDefinitions)
      .where(eq(fieldDefinitions.key, key))
      .limit(1);
    if (!exists) break;
    key = `${slugKey(parsed.label)}_${i + 1}`;
  }
  await db.insert(fieldDefinitions).values({
    id: randomUUID(),
    key,
    label: parsed.label.trim(),
    fieldType: parsed.fieldType,
    isCustom: true,
    systemColumn: null,
    isActive: true,
    isRequired: false,
    searchable: true,
    filterable: true,
    sortOrder: 100,
    selectOptions: parsed.selectOptions ?? [],
  });
  revalidatePath("/settings/fields");
  revalidatePath("/records");
  revalidatePath("/records/new");
  return { ok: true as const };
}

export async function deleteCustomFieldAction(input: unknown) {
  await requireManager();
  const idResult = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!idResult.success) {
    return { ok: false as const, error: formatZodError(idResult.error) };
  }
  const { id } = idResult.data;
  const db = getDb();
  const [row] = await db
    .select()
    .from(fieldDefinitions)
    .where(eq(fieldDefinitions.id, id))
    .limit(1);
  if (!row?.isCustom) {
    return { ok: false as const, error: "Only custom fields can be deleted." };
  }
  await db.delete(fieldDefinitions).where(eq(fieldDefinitions.id, id));
  revalidatePath("/settings/fields");
  revalidatePath("/records");
  revalidatePath("/records/new");
  return { ok: true as const };
}
