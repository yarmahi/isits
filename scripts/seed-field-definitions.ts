/**
 * Seeds default system field definition rows (optional column visibility).
 * Run after migrations: npx tsx scripts/seed-field-definitions.ts
 */
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { fieldDefinitions } from "../db/schema";

async function main() {
  const db = getDb();
  const defaults = [
    {
      id: "fd-sys-tag-number",
      key: "sys_tag_number",
      label: "Tag number",
      fieldType: "text",
      isCustom: false,
      systemColumn: "tag_number",
      isActive: true,
      isRequired: false,
      searchable: true,
      filterable: true,
      sortOrder: 10,
      selectOptions: [] as { value: string; label: string }[],
    },
    {
      id: "fd-sys-maintenance-note",
      key: "sys_maintenance_note",
      label: "Maintenance note",
      fieldType: "textarea",
      isCustom: false,
      systemColumn: "maintenance_note",
      isActive: true,
      isRequired: false,
      searchable: true,
      filterable: false,
      sortOrder: 20,
      selectOptions: [],
    },
    {
      id: "fd-sys-date-returned",
      key: "sys_date_returned",
      label: "Date returned",
      fieldType: "date",
      isCustom: false,
      systemColumn: "date_returned",
      isActive: true,
      isRequired: false,
      searchable: false,
      filterable: true,
      sortOrder: 30,
      selectOptions: [],
    },
  ] as const;

  for (const d of defaults) {
    const [x] = await db
      .select({ id: fieldDefinitions.id })
      .from(fieldDefinitions)
      .where(eq(fieldDefinitions.id, d.id))
      .limit(1);
    if (!x) {
      await db.insert(fieldDefinitions).values({
        ...d,
        selectOptions: [...d.selectOptions],
      });
      console.log("Inserted field definition", d.key);
    }
  }
  console.log("Field definitions seed done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
