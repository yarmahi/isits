import { asc, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { fieldDefinitions } from "@/db/schema";

export type SystemVisibility = {
  tagNumber: boolean;
  maintenanceNote: boolean;
  dateReturned: boolean;
};

export type FieldDefinitionPublic = {
  id: string;
  key: string;
  label: string;
  fieldType: string;
  isCustom: boolean;
  systemColumn: string | null;
  isActive: boolean;
  isRequired: boolean;
  searchable: boolean;
  filterable: boolean;
  sortOrder: number;
  selectOptions: { value: string; label: string }[];
};

const DEFAULT_VISIBILITY: SystemVisibility = {
  tagNumber: true,
  maintenanceNote: true,
  dateReturned: true,
};

function rowToPublic(r: typeof fieldDefinitions.$inferSelect): FieldDefinitionPublic {
  return {
    id: r.id,
    key: r.key,
    label: r.label,
    fieldType: r.fieldType,
    isCustom: r.isCustom,
    systemColumn: r.systemColumn,
    isActive: r.isActive,
    isRequired: r.isRequired,
    searchable: r.searchable,
    filterable: r.filterable,
    sortOrder: r.sortOrder,
    selectOptions: r.selectOptions ?? [],
  };
}

/** Active custom fields + which optional system columns to show (Phase 6). */
export async function loadRecordFieldConfig(): Promise<{
  systemVisibility: SystemVisibility;
  customFields: FieldDefinitionPublic[];
}> {
  const db = getDb();
  const rows = await db
    .select()
    .from(fieldDefinitions)
    .orderBy(asc(fieldDefinitions.sortOrder), asc(fieldDefinitions.label));

  if (rows.length === 0) {
    return {
      systemVisibility: { ...DEFAULT_VISIBILITY },
      customFields: [],
    };
  }

  const byCol = new Map(
    rows
      .filter((r) => r.systemColumn)
      .map((r) => [r.systemColumn as string, r]),
  );

  return {
    systemVisibility: {
      tagNumber: byCol.get("tag_number")?.isActive ?? DEFAULT_VISIBILITY.tagNumber,
      maintenanceNote:
        byCol.get("maintenance_note")?.isActive ??
        DEFAULT_VISIBILITY.maintenanceNote,
      dateReturned:
        byCol.get("date_returned")?.isActive ?? DEFAULT_VISIBILITY.dateReturned,
    },
    customFields: rows
      .filter((r) => r.isCustom && r.isActive)
      .map(rowToPublic),
  };
}

/** Include inactive rows for manager settings (full list). */
export async function loadAllFieldDefinitions(): Promise<FieldDefinitionPublic[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(fieldDefinitions)
    .orderBy(asc(fieldDefinitions.sortOrder), asc(fieldDefinitions.label));
  return rows.map(rowToPublic);
}

/** Paginated field definitions for Settings (same ordering as full list). */
export async function loadFieldDefinitionsPage(params: {
  page: number;
  pageSize: number;
}): Promise<{ rows: FieldDefinitionPublic[]; total: number }> {
  const db = getDb();
  const page = Math.max(1, params.page);
  const pageSize = Math.min(50, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;

  const [tot] = await db.select({ c: count() }).from(fieldDefinitions);
  const total = Number(tot?.c ?? 0);

  const rows = await db
    .select()
    .from(fieldDefinitions)
    .orderBy(asc(fieldDefinitions.sortOrder), asc(fieldDefinitions.label))
    .limit(pageSize)
    .offset(offset);

  return {
    total,
    rows: rows.map(rowToPublic),
  };
}
