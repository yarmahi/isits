"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Pencil, Plus, Trash2, Truck } from "lucide-react";
import {
  createDeliveryMethodAction,
  deleteDeliveryMethodAction,
  updateDeliveryMethodAction,
  type DeliveryMethodListRow,
} from "@/services/delivery-methods";
import {
  confirmDanger,
  toastError,
  toastSuccess,
  toastWarning,
} from "@/lib/sweet-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ImportCsvDialog } from "@/components/import/import-csv-dialog";
import { DELIVERY_METHODS_IMPORT } from "@/lib/import-csv-templates";
import { stubCsvImportFromFile } from "@/lib/stub-csv-import-client";

export const DELIVERY_METHODS_DEFAULT_PAGE_SIZE = 10;

function buildDeliveryMethodsUrl(page: number, pageSize: number) {
  const usp = new URLSearchParams();
  if (page > 1) usp.set("page", String(page));
  if (pageSize !== DELIVERY_METHODS_DEFAULT_PAGE_SIZE) {
    usp.set("pageSize", String(pageSize));
  }
  const s = usp.toString();
  return s ? `/settings/delivery-methods?${s}` : "/settings/delivery-methods";
}

function formatUpdated(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; row: DeliveryMethodListRow }
  | null;

type Props = {
  rows: DeliveryMethodListRow[];
  total: number;
  page: number;
  pageSize: number;
};

/** Manager settings: delivery methods table, add/edit dialogs, pagination. */
export function DeliveryMethodsSettingsClient({
  rows,
  total,
  page,
  pageSize,
}: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [pending, setPending] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (!dialog) return;
    if (dialog.mode === "create") {
      setCode("");
      setName("");
      setSortOrder(0);
      setIsActive(true);
    } else {
      setCode(dialog.row.code);
      setName(dialog.row.name);
      setSortOrder(dialog.row.sortOrder);
      setIsActive(dialog.row.isActive);
    }
  }, [dialog]);

  const buildHref = useMemo(
    () => (nextPage: number) => buildDeliveryMethodsUrl(nextPage, pageSize),
    [pageSize],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dialog) return;
    setPending(true);
    try {
      if (dialog.mode === "create") {
        const res = await createDeliveryMethodAction({
          code,
          name,
          sortOrder,
          isActive,
        });
        if (!res.ok) {
          await toastError("Could not add delivery method", res.error);
          return;
        }
        await toastSuccess("Delivery method added");
        setDialog(null);
        router.refresh();
        return;
      }
      const res = await updateDeliveryMethodAction({
        id: dialog.row.id,
        code,
        name,
        sortOrder,
        isActive,
      });
      if (!res.ok) {
        await toastError("Could not update delivery method", res.error);
        return;
      }
      await toastSuccess("Delivery method updated");
      setDialog(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onDelete(row: DeliveryMethodListRow) {
    const ok = await confirmDanger({
      title: "Delete delivery method?",
      text: `Permanently remove “${row.name}” only works when no records use it.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    const res = await deleteDeliveryMethodAction({ id: row.id });
    if (!res.ok) {
      if (res.code === "IN_USE") {
        await toastWarning(
          "Cannot delete",
          "This delivery method is assigned to records. Deactivate it instead.",
        );
      } else {
        await toastError("Delete failed", res.error);
      }
      return;
    }
    await toastSuccess("Delivery method deleted");
    router.refresh();
  }

  async function quickSetActive(row: DeliveryMethodListRow, next: boolean) {
    setPending(true);
    try {
      const res = await updateDeliveryMethodAction({
        id: row.id,
        isActive: next,
      });
      if (!res.ok) {
        await toastError("Could not update", res.error);
        return;
      }
      await toastSuccess(
        next ? "Delivery method activated" : "Delivery method deactivated",
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Delivery methods
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage delivery methods
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setImportOpen(true)}
          >
            <FileUp className="size-4" aria-hidden />
            Import
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus className="size-4" aria-hidden />
            Add method
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Sort</TableHead>
              <TableHead className="px-4">Code</TableHead>
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Active</TableHead>
              <TableHead className="hidden px-4 md:table-cell">Updated</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
                      <Truck
                        className="size-6 text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                    <p className="font-medium text-foreground">
                      No delivery methods yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add or seed data.
                    </p>
                    <Button
                      type="button"
                      className="gap-2"
                      onClick={() => setDialog({ mode: "create" })}
                    >
                      <Plus className="size-4" aria-hidden />
                      Add method
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 tabular-nums text-muted-foreground">
                    {row.sortOrder}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs">{row.code}</TableCell>
                  <TableCell className="px-4 font-medium">{row.name}</TableCell>
                  <TableCell className="px-4">
                    {row.isActive ? (
                      <Badge
                        variant="secondary"
                        className="border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-200"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden px-4 text-muted-foreground md:table-cell">
                    {formatUpdated(row.updatedAt)}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm">
                      <button
                        type="button"
                        className="cursor-pointer font-medium text-primary hover:underline disabled:opacity-50"
                        disabled={pending}
                        onClick={() => setDialog({ mode: "edit", row })}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </span>
                      </button>
                      {row.isActive ? (
                        <button
                          type="button"
                          className="cursor-pointer font-medium text-muted-foreground hover:underline disabled:opacity-50"
                          disabled={pending}
                          onClick={() => quickSetActive(row, false)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="cursor-pointer font-medium text-primary hover:underline disabled:opacity-50"
                          disabled={pending}
                          onClick={() => quickSetActive(row, true)}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        type="button"
                        className="cursor-pointer font-medium text-destructive hover:underline disabled:opacity-50"
                        disabled={pending}
                        onClick={() => onDelete(row)}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Trash2 className="size-3.5" aria-hidden />
                          Delete
                        </span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          total={total}
          page={page}
          pageSize={pageSize}
          buildHref={buildHref}
          aria-label="Delivery methods list pagination"
        />
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>
                {dialog?.mode === "edit"
                  ? "Edit delivery method"
                  : "Add delivery method"}
              </DialogTitle>
              <DialogDescription>
                Unique code. Deactivate if referenced.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <Field>
                <FieldLabel htmlFor="dm-code">Code</FieldLabel>
                <Input
                  id="dm-code"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                  maxLength={80}
                  required
                  disabled={pending}
                  className="font-mono text-sm"
                  placeholder="e.g. by_car"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and underscores only.
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="dm-name">Name</FieldLabel>
                <Input
                  id="dm-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  maxLength={200}
                  required
                  disabled={pending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="dm-sort">Sort order</FieldLabel>
                <Input
                  id="dm-sort"
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={99999}
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(parseInt(e.target.value, 10) || 0)
                  }
                  disabled={pending}
                />
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className={cn(
                    "size-4 rounded border-input accent-primary",
                    pending && "cursor-not-allowed opacity-50",
                  )}
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={pending}
                />
                <span>Active (available for new records)</span>
              </label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog(null)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {dialog?.mode === "edit" ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import delivery methods"
        description="Download the sample CSV, then upload a filled file."
        templateFilename={DELIVERY_METHODS_IMPORT.filename}
        headers={DELIVERY_METHODS_IMPORT.headers}
        exampleRow={DELIVERY_METHODS_IMPORT.exampleRow}
        onImport={stubCsvImportFromFile}
      />
    </div>
  );
}
