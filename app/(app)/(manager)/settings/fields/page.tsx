import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadAllFieldDefinitions } from "@/lib/record-field-config";
import { requireManager } from "@/lib/permissions";
import { FieldSettingsClient } from "@/components/field-definitions/field-settings-client";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Manager-only: record field definitions and optional system column visibility. */
export default async function FieldSettingsPage() {
  await requireManager();
  const rows = await loadAllFieldDefinitions();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/settings"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Settings
        </Link>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Record fields</h1>
        <p className="text-sm text-muted-foreground">
          Show or hide optional columns, add custom fields, and control how they
          appear on records and in search.
        </p>
      </div>
      <FieldSettingsClient initialRows={rows} />
    </div>
  );
}
