"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { ImportCsvDialog } from "@/components/import/import-csv-dialog";
import { Button } from "@/components/ui/button";
import { RECORDS_IMPORT } from "@/lib/import-csv-templates";
import { stubCsvImportFromFile } from "@/lib/stub-csv-import-client";

/** Records list header: opens shared CSV import dialog (Phase A stub). */
export function RecordsCsvImportButton() {
  const [open, setOpen] = useState(false);

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
        description="Legacy migration: download the sample CSV, then upload a filled file."
        templateFilename={RECORDS_IMPORT.filename}
        headers={RECORDS_IMPORT.headers}
        exampleRow={RECORDS_IMPORT.exampleRow}
        onImport={stubCsvImportFromFile}
      />
    </>
  );
}
