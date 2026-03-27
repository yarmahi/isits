"use server";

import { randomUUID } from "crypto";
import { asc, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { branches, records } from "@/db/schema";
import { formatZodError } from "@/lib/format-zod-error";
import { requireManager } from "@/lib/permissions";

export type BranchListRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

function toPublic(row: typeof branches.$inferSelect): BranchListRow {
  return {
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Paginated branches for Settings (manager-only). */
export async function getBranchesPage(params: {
  page: number;
  pageSize: number;
}): Promise<{ rows: BranchListRow[]; total: number }> {
  await requireManager();
  const db = getDb();
  const page = Math.max(1, params.page);
  const pageSize = Math.min(50, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;

  const [tot] = await db.select({ c: count() }).from(branches);
  const total = Number(tot?.c ?? 0);

  const raw = await db
    .select()
    .from(branches)
    .orderBy(asc(branches.name))
    .limit(pageSize)
    .offset(offset);

  return {
    total,
    rows: raw.map(toPublic),
  };
}

export async function createBranchAction(input: unknown) {
  await requireManager();
  const parsedResult = createSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: formatZodError(parsedResult.error) };
  }
  const parsed = parsedResult.data;
  const db = getDb();
  await db.insert(branches).values({
    id: randomUUID(),
    name: parsed.name,
    isActive: parsed.isActive ?? true,
  });
  revalidatePath("/settings/branches");
  revalidatePath("/records");
  revalidatePath("/records/new");
  return { ok: true as const };
}

export async function updateBranchAction(input: unknown) {
  await requireManager();
  const parsedResult = updateSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: formatZodError(parsedResult.error) };
  }
  const parsed = parsedResult.data;
  if (parsed.name === undefined && parsed.isActive === undefined) {
    return { ok: false as const, error: "Nothing to update." };
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(branches)
    .where(eq(branches.id, parsed.id))
    .limit(1);
  if (!row) {
    return { ok: false as const, error: "Branch not found." };
  }
  const patch: Partial<typeof branches.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.isActive !== undefined) patch.isActive = parsed.isActive;
  await db.update(branches).set(patch).where(eq(branches.id, parsed.id));
  revalidatePath("/settings/branches");
  revalidatePath("/records");
  revalidatePath("/records/new");
  return { ok: true as const };
}

export type DeleteBranchResult =
  | { ok: true }
  | { ok: false; error: string; code?: "IN_USE" };

/** Hard delete only when no records reference this branch (FK). Otherwise use deactivate. */
export async function deleteBranchAction(input: unknown): Promise<DeleteBranchResult> {
  await requireManager();
  const parsedResult = idSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false, error: formatZodError(parsedResult.error) };
  }
  const { id } = parsedResult.data;
  const db = getDb();
  const [branch] = await db
    .select()
    .from(branches)
    .where(eq(branches.id, id))
    .limit(1);
  if (!branch) {
    return { ok: false, error: "Branch not found." };
  }
  const [usage] = await db
    .select({ c: count() })
    .from(records)
    .where(eq(records.branchId, id));
  const n = Number(usage?.c ?? 0);
  if (n > 0) {
    return {
      ok: false,
      error:
        "This branch is assigned to one or more records. Deactivate it instead of deleting.",
      code: "IN_USE",
    };
  }
  await db.delete(branches).where(eq(branches.id, id));
  revalidatePath("/settings/branches");
  revalidatePath("/records");
  revalidatePath("/records/new");
  return { ok: true };
}
