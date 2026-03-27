"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ListTree, Plus, Trash2 } from "lucide-react";
import type { FieldDefinitionPublic } from "@/lib/record-field-config";
import {
  createCustomFieldAction,
  deleteCustomFieldAction,
  updateFieldDefinitionAction,
} from "@/services/field-definitions";
import {
  confirmDanger,
  toastError,
  toastSuccess,
} from "@/lib/sweet-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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

const FIELD_TYPES = ["text", "textarea", "number", "date", "select"] as const;

export const FIELD_DEFINITIONS_DEFAULT_PAGE_SIZE = 10;

function buildFieldsUrl(page: number, pageSize: number) {
  const usp = new URLSearchParams();
  if (page > 1) usp.set("page", String(page));
  if (pageSize !== FIELD_DEFINITIONS_DEFAULT_PAGE_SIZE) {
    usp.set("pageSize", String(pageSize));
  }
  const s = usp.toString();
  return s ? `/settings/fields?${s}` : "/settings/fields";
}

function parseSelectOptions(raw: string): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const i = t.indexOf("|");
    if (i === -1) {
      out.push({ value: t, label: t });
    } else {
      out.push({
        value: t.slice(0, i).trim(),
        label: t.slice(i + 1).trim() || t.slice(0, i).trim(),
      });
    }
  }
  return out;
}

function Toggle({
  checked,
  disabled,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors",
        checked ? "bg-primary" : "bg-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-background shadow ring-1 ring-border transition-transform",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}

type Props = {
  initialRows: FieldDefinitionPublic[];
  total: number;
  page: number;
  pageSize: number;
};

/** Record field definitions: aligned with lookup settings tables (Chapter 2 Phase E). */
export function FieldSettingsClient({
  initialRows,
  total,
  page,
  pageSize,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState(initialRows);
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] =
    useState<(typeof FIELD_TYPES)[number]>("text");
  const [selectLines, setSelectLines] = useState("");

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    if (!createOpen) return;
    setLabel("");
    setFieldType("text");
    setSelectLines("");
  }, [createOpen]);

  const buildHref = useMemo(
    () => (nextPage: number) => buildFieldsUrl(nextPage, pageSize),
    [pageSize],
  );

  function patchLocal(id: string, patch: Partial<FieldDefinitionPublic>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  async function runUpdate(
    payload: Parameters<typeof updateFieldDefinitionAction>[0],
  ) {
    setPending(true);
    try {
      const res = await updateFieldDefinitionAction(payload);
      if (!res.ok) {
        await toastError("Update failed", res.error);
        router.refresh();
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onToggle(
    row: FieldDefinitionPublic,
    key: "isActive" | "isRequired" | "searchable" | "filterable",
    next: boolean,
  ) {
    if (!row.isCustom && key === "isRequired") return;
    patchLocal(row.id, { [key]: next });
    await runUpdate({ id: row.id, [key]: next });
  }

  async function onSortBlur(row: FieldDefinitionPublic, raw: string) {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0 || n > 9999) {
      await toastError("Invalid order", "Use 0–9999.");
      patchLocal(row.id, { sortOrder: row.sortOrder });
      return;
    }
    if (n === row.sortOrder) return;
    patchLocal(row.id, { sortOrder: n });
    await runUpdate({ id: row.id, sortOrder: n });
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      await toastError("Label required", "Enter a field label.");
      return;
    }
    const selectOptions =
      fieldType === "select" ? parseSelectOptions(selectLines) : undefined;
    if (fieldType === "select" && (!selectOptions || selectOptions.length === 0)) {
      await toastError("Options required", "Add at least one select option.");
      return;
    }
    setPending(true);
    try {
      const res = await createCustomFieldAction({
        label: label.trim(),
        fieldType,
        selectOptions,
      });
      if (!res.ok) {
        const msg =
          "error" in res && typeof res.error === "string" ? res.error : "";
        await toastError("Could not create", msg || undefined);
        return;
      }
      await toastSuccess("Custom field added");
      setCreateOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onDelete(row: FieldDefinitionPublic) {
    const ok = await confirmDanger({
      title: "Delete this field?",
      text: row.label,
      confirmText: "Delete",
    });
    if (!ok) return;
    setPending(true);
    try {
      const res = await deleteCustomFieldAction({ id: row.id });
      if (!res.ok) {
        await toastError("Delete failed", res.error);
        return;
      }
      await toastSuccess("Field removed");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">Record fields</h2>
          <p className="text-sm text-muted-foreground">Manage fields</p>
        </div>
        <Button
          type="button"
          className="shrink-0 gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
          Add custom field
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Field</TableHead>
              <TableHead className="px-4">Type</TableHead>
              <TableHead className="px-4 text-center">Active</TableHead>
              <TableHead className="px-4 text-center">Required</TableHead>
              <TableHead className="px-4 text-center">Search</TableHead>
              <TableHead className="px-4 text-center">Filter</TableHead>
              <TableHead className="px-4">Order</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="p-0">
                  <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
                      <ListTree
                        className="size-6 text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                    <p className="font-medium text-foreground">
                      No field definitions
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add or seed data.
                    </p>
                    <Button
                      type="button"
                      className="gap-2"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus className="size-4" aria-hidden />
                      Add custom field
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 align-middle">
                    <span className="font-medium">{row.label}</span>
                    {!row.isCustom && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (system)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 align-middle text-muted-foreground">
                    {row.fieldType}
                  </TableCell>
                  <TableCell className="px-4 text-center align-middle">
                    <div className="flex justify-center">
                      <Toggle
                        checked={row.isActive}
                        aria-label={`Active: ${row.label}`}
                        onChange={(next) => onToggle(row, "isActive", next)}
                        disabled={pending}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-center align-middle">
                    <div className="flex justify-center">
                      <Toggle
                        checked={row.isRequired}
                        aria-label={`Required: ${row.label}`}
                        onChange={(next) => onToggle(row, "isRequired", next)}
                        disabled={pending || !row.isCustom}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-center align-middle">
                    <div className="flex justify-center">
                      <Toggle
                        checked={row.searchable}
                        aria-label={`Searchable: ${row.label}`}
                        onChange={(next) => onToggle(row, "searchable", next)}
                        disabled={pending}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-center align-middle">
                    <div className="flex justify-center">
                      <Toggle
                        checked={row.filterable}
                        aria-label={`Filterable: ${row.label}`}
                        onChange={(next) => onToggle(row, "filterable", next)}
                        disabled={pending}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 align-middle">
                    <Input
                      key={`${row.id}-${row.sortOrder}`}
                      type="number"
                      min={0}
                      max={9999}
                      className="h-8 w-20"
                      defaultValue={row.sortOrder}
                      disabled={pending}
                      onBlur={(e) => onSortBlur(row, e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="px-4 text-right align-middle">
                    {row.isCustom ? (
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
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
          aria-label="Field definitions pagination"
        />
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[min(90vh,36rem)] overflow-y-auto sm:max-w-md">
          <form onSubmit={onCreate}>
            <DialogHeader>
              <DialogTitle>Add custom field</DialogTitle>
              <DialogDescription>
                Select type needs options.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-3 py-2">
              <Field>
                <FieldLabel htmlFor="newLabel">Label</FieldLabel>
                <Input
                  id="newLabel"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Asset ID"
                  disabled={pending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="newType">Type</FieldLabel>
                <select
                  id="newType"
                  value={fieldType}
                  onChange={(e) =>
                    setFieldType(e.target.value as (typeof FIELD_TYPES)[number])
                  }
                  disabled={pending}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              {fieldType === "select" && (
                <Field>
                  <FieldLabel htmlFor="selectOpts">
                    Select options (one per line:{" "}
                    <code className="text-xs">value|label</code>)
                  </FieldLabel>
                  <textarea
                    id="selectOpts"
                    value={selectLines}
                    onChange={(e) => setSelectLines(e.target.value)}
                    rows={4}
                    disabled={pending}
                    className="flex min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    placeholder={"opt_a|Option A\nopt_b|Option B"}
                  />
                </Field>
              )}
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Add field
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
