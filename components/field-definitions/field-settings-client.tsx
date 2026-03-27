"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import type { FieldDefinitionPublic } from "@/lib/record-field-config";
import {
  createCustomFieldAction,
  deleteCustomFieldAction,
  updateFieldDefinitionAction,
} from "@/services/field-definitions";
import { toastError, toastSuccess } from "@/lib/sweet-alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FIELD_TYPES = ["text", "textarea", "number", "date", "select"] as const;

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

export function FieldSettingsClient({
  initialRows,
}: {
  initialRows: FieldDefinitionPublic[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState(initialRows);
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] =
    useState<(typeof FIELD_TYPES)[number]>("text");
  const [selectLines, setSelectLines] = useState("");

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
      setLabel("");
      setFieldType("text");
      setSelectLines("");
      await toastSuccess("Custom field added");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onDelete(row: FieldDefinitionPublic) {
    const r = await Swal.fire({
      title: "Delete this field?",
      text: row.label,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!r.isConfirmed) return;
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
    <div className="space-y-8">
      <div className="overflow-x-auto rounded-xl border border-border/80">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40">
              <th className="px-3 py-2 font-medium">Field</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium text-center">Active</th>
              <th className="px-3 py-2 font-medium text-center">Required</th>
              <th className="px-3 py-2 font-medium text-center">Search</th>
              <th className="px-3 py-2 font-medium text-center">Filter</th>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/60 last:border-0"
              >
                <td className="px-3 py-2 align-middle">
                  <span className="font-medium">{row.label}</span>
                  {!row.isCustom && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (system)
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 align-middle text-muted-foreground">
                  {row.fieldType}
                </td>
                <td className="px-3 py-2 text-center align-middle">
                  <div className="flex justify-center">
                    <Toggle
                      checked={row.isActive}
                      aria-label={`Active: ${row.label}`}
                      onChange={(next) => onToggle(row, "isActive", next)}
                      disabled={pending}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 text-center align-middle">
                  <div className="flex justify-center">
                    <Toggle
                      checked={row.isRequired}
                      aria-label={`Required: ${row.label}`}
                      onChange={(next) => onToggle(row, "isRequired", next)}
                      disabled={pending || !row.isCustom}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 text-center align-middle">
                  <div className="flex justify-center">
                    <Toggle
                      checked={row.searchable}
                      aria-label={`Searchable: ${row.label}`}
                      onChange={(next) => onToggle(row, "searchable", next)}
                      disabled={pending}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 text-center align-middle">
                  <div className="flex justify-center">
                    <Toggle
                      checked={row.filterable}
                      aria-label={`Filterable: ${row.label}`}
                      onChange={(next) => onToggle(row, "filterable", next)}
                      disabled={pending}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 align-middle">
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
                </td>
                <td className="px-3 py-2 align-middle text-right">
                  {row.isCustom && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => onDelete(row)}
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={onCreate}
        className="max-w-xl space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4"
      >
        <h2 className="text-base font-semibold">Add custom field</h2>
        <FieldGroup className="gap-3">
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
              className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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
        <Button type="submit" disabled={pending}>
          Add field
        </Button>
      </form>
    </div>
  );
}
