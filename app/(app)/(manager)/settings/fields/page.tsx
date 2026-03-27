import { loadAllFieldDefinitions } from "@/lib/record-field-config";
import { requireManager } from "@/lib/permissions";
import { FieldSettingsClient } from "@/components/field-definitions/field-settings-client";

/** Manager-only: record field definitions and optional system column visibility. */
export default async function FieldSettingsPage() {
  await requireManager();
  const rows = await loadAllFieldDefinitions();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Record fields</h2>
        <p className="text-sm text-muted-foreground">
          Show or hide optional columns, add custom fields, and control how they
          appear on records and in search.
        </p>
      </div>
      <FieldSettingsClient initialRows={rows} />
    </div>
  );
}
