"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { ImportCsvDialog } from "@/components/import/import-csv-dialog";
import { Button } from "@/components/ui/button";
import { RECORDS_IMPORT } from "@/lib/import-csv-templates";
import { importRecordsCsvFromFile } from "@/lib/records-import-csv-client";

type Props = { showImport: boolean };

/** Records list header: legacy CSV import (managers only). */
export function RecordsCsvImportButton({ showImport }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!showImport) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <FileUp className="size-4" aria-hidden />
        Import
      </Button>
      <ImportCsvDialog
        open={open}
        onOpenChange={setOpen}
        title="Import records"
        description="Managers only. Blank cells get legacy placeholders; lookups accept id or code/name."
        templateFilename={RECORDS_IMPORT.filename}
        headers={RECORDS_IMPORT.headers}
        exampleRow={RECORDS_IMPORT.exampleRow}
        onImport={importRecordsCsvFromFile}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
