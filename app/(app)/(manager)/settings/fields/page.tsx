import {
  FIELD_DEFINITIONS_DEFAULT_PAGE_SIZE,
  FieldSettingsClient,
} from "@/components/field-definitions/field-settings-client";
import { requireManager } from "@/lib/permissions";
import { loadFieldDefinitionsPage } from "@/lib/record-field-config";

/** Manager-only: record field definitions (Chapter 2 Phase E shell + pagination). */
export default async function FieldSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  await requireManager();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(
      5,
      parseInt(sp.pageSize ?? String(FIELD_DEFINITIONS_DEFAULT_PAGE_SIZE), 10) ||
        FIELD_DEFINITIONS_DEFAULT_PAGE_SIZE,
    ),
  );
  const { rows, total } = await loadFieldDefinitionsPage({ page, pageSize });

  return (
    <FieldSettingsClient
      initialRows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
    />
  );
}
