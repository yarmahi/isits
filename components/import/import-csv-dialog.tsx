"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { buildCsvContent } from "@/lib/csv-template";
import type { ImportCsvResult } from "@/lib/import-csv-types";
import { toastError, toastSuccess, toastWarning } from "@/lib/sweet-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type { ImportCsvResult } from "@/lib/import-csv-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  templateFilename: string;
  headers: readonly string[] | string[];
  exampleRow?: readonly string[] | string[];
  /** Called with the chosen file; Phase B+ performs real imports. */
  onImport: (file: File) => Promise<ImportCsvResult>;
  /** Runs after a successful import (e.g. router.refresh). */
  onSuccess?: () => void;
};

function downloadTemplate(
  filename: string,
  headers: readonly string[] | string[],
  exampleRow?: readonly string[] | string[],
) {
  const rows = exampleRow?.length ? [exampleRow as string[]] : [];
  const content = buildCsvContent([...headers], rows);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Shared CSV import modal: template download + file pick + submit (Chapter 3 Phase A). */
export function ImportCsvDialog({
  open,
  onOpenChange,
  title,
  description,
  templateFilename,
  headers,
  exampleRow,
  onImport,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);

  function resetAndClose() {
    setFile(null);
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!file) {
      await toastError("No file", "Choose a CSV file.");
      return;
    }
    setPending(true);
    try {
      const res = await onImport(file);
      if (!res.ok) {
        await toastError("Import failed", res.error);
        return;
      }
      if (res.rowFailures?.length) {
        const lines = res.rowFailures
          .slice(0, 12)
          .map((f) => `Row ${f.row}: ${f.reason}`);
        const tail =
          res.rowFailures.length > 12
            ? `\n…${res.rowFailures.length - 12} more`
            : "";
        await toastWarning(
          "Import finished with errors",
          [res.message ?? "Done.", "", ...lines].join("\n") + tail,
          18_000,
        );
      } else {
        await toastSuccess(
          "Import finished",
          res.message ?? "File accepted.",
        );
      }
      onSuccess?.();
      resetAndClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFile(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={() =>
              downloadTemplate(templateFilename, headers, exampleRow)
            }
          >
            Download sample CSV
          </Button>
          <div className="space-y-2">
            <label
              htmlFor="csv-import-file"
              className="text-sm font-medium text-foreground"
            >
              Upload CSV
            </label>
            <input
              id="csv-import-file"
              type="file"
              accept=".csv,text/csv"
              disabled={pending}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f ?? null);
              }}
            />
            {file ? (
              <p className="text-xs text-muted-foreground">{file.name}</p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => resetAndClose()}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={pending || !file}
            onClick={() => void handleSubmit()}
          >
            <FileUp className="size-4" aria-hidden />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
