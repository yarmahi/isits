"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRecordAction, updateRecordAction } from "@/services/records";
import { toastSuccess } from "@/lib/sweet-alert";
import type {
  FieldDefinitionPublic,
  SystemVisibility,
} from "@/lib/record-field-config";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LookupRow = { id: string; name: string };

export type RecordLookups = {
  branches: LookupRow[];
  statuses: LookupRow[];
  deliveryMethods: LookupRow[];
};

type Initial = {
  recordId: string;
  recordNo: string;
  dateReceived: string;
  dateReturned: string;
  branchId: string;
  pcModel: string;
  serialNumber: string;
  tagNumber: string;
  maintenanceNote: string;
  customerName: string;
  phoneNumber: string;
  statusId: string;
  deliveryMethodId: string;
};

type Props = {
  mode: "create" | "edit";
  lookups: RecordLookups;
  initial?: Initial;
  defaultDateReceived?: string;
  systemVisibility: SystemVisibility;
  customFields: FieldDefinitionPublic[];
  /** Values for `custom_data` keys (edit mode). */
  initialCustomData?: Record<string, unknown>;
};

const textareaClass =
  "flex min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30";

const selectFieldClass =
  "flex h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

function Req() {
  return (
    <span className="text-destructive" aria-hidden>
      {" "}
      *
    </span>
  );
}

function collectCustomData(
  fd: FormData,
  fields: FieldDefinitionPublic[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = fd.get(`custom_${f.key}`);
    if (raw === null) continue;
    const s = String(raw);
    if (f.fieldType === "number") {
      const n = parseFloat(s);
      out[f.key] = Number.isFinite(n) ? n : s;
    } else {
      out[f.key] = s;
    }
  }
  return out;
}

function customDefault(
  key: string,
  initialCustomData: Record<string, unknown> | undefined,
): string {
  const v = initialCustomData?.[key];
  if (v === undefined || v === null) return "";
  return String(v);
}

/** Create / edit form: core columns + configurable optional system fields + custom fields (Phase 6). */
export function RecordForm({
  mode,
  lookups,
  initial,
  defaultDateReceived,
  systemVisibility,
  customFields,
  initialCustomData,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const dateReceivedDefault =
    mode === "edit" && initial?.dateReceived
      ? initial.dateReceived
      : (defaultDateReceived ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const customData = collectCustomData(fd, customFields);
    const payload = {
      dateReceived: String(fd.get("dateReceived") ?? ""),
      dateReturned: String(fd.get("dateReturned") ?? ""),
      branchId: String(fd.get("branchId") ?? ""),
      pcModel: String(fd.get("pcModel") ?? ""),
      serialNumber: String(fd.get("serialNumber") ?? ""),
      tagNumber: String(fd.get("tagNumber") ?? ""),
      maintenanceNote: String(fd.get("maintenanceNote") ?? ""),
      customerName: String(fd.get("customerName") ?? ""),
      phoneNumber: String(fd.get("phoneNumber") ?? ""),
      statusId: String(fd.get("statusId") ?? ""),
      deliveryMethodId: String(fd.get("deliveryMethodId") ?? ""),
      customData,
    };

    const res =
      mode === "create"
        ? await createRecordAction(payload)
        : await updateRecordAction({
            ...payload,
            recordId: initial!.recordId,
          });
    setPending(false);

    if (!res.ok) {
      setFormError(
        "error" in res && typeof res.error === "string"
          ? res.error
          : "Could not save. Try again.",
      );
      return;
    }
    if (mode === "create" && "recordId" in res) {
      router.push("/records?created=1");
      router.refresh();
      return;
    }
    await toastSuccess("Record saved");
    router.push(`/records/${initial!.recordId}`);
    router.refresh();
  }

  const showReturned = systemVisibility.dateReturned;
  const showTag = systemVisibility.tagNumber;
  const showMaintenance = systemVisibility.maintenanceNote;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {formError}
        </div>
      )}
      {mode === "edit" && initial && (
        <p className="text-sm text-muted-foreground">
          Record number:{" "}
          <span className="font-mono font-medium text-foreground">
            {initial.recordNo}
          </span>
        </p>
      )}
      <FieldGroup className="gap-4">
        <div
          className={cn(
            "grid gap-4",
            showReturned ? "sm:grid-cols-2" : "grid-cols-1",
          )}
        >
          <Field>
            <FieldLabel htmlFor="dateReceived">
              Date received
              <Req />
            </FieldLabel>
            <Input
              id="dateReceived"
              name="dateReceived"
              type="date"
              required
              defaultValue={dateReceivedDefault}
            />
          </Field>
          {showReturned && (
            <Field>
              <FieldLabel htmlFor="dateReturned">Date returned</FieldLabel>
              <Input
                id="dateReturned"
                name="dateReturned"
                type="date"
                defaultValue={initial?.dateReturned || ""}
              />
            </Field>
          )}
        </div>
        <Field>
          <FieldLabel htmlFor="branchId">
            Branch
            <Req />
          </FieldLabel>
          <select
            id="branchId"
            name="branchId"
            required
            defaultValue={initial?.branchId}
            className={cn(
              "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer md:text-sm dark:bg-input/30",
            )}
          >
            <option value="">Select branch</option>
            {lookups.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="pcModel">
            PC model
            <Req />
          </FieldLabel>
          <Input
            id="pcModel"
            name="pcModel"
            required
            defaultValue={initial?.pcModel}
          />
        </Field>
        <div
          className={cn(
            "grid gap-4",
            showTag ? "sm:grid-cols-2" : "grid-cols-1",
          )}
        >
          <Field>
            <FieldLabel htmlFor="serialNumber">
              Serial number
              <Req />
            </FieldLabel>
            <Input
              id="serialNumber"
              name="serialNumber"
              required
              defaultValue={initial?.serialNumber}
            />
          </Field>
          {showTag && (
            <Field>
              <FieldLabel htmlFor="tagNumber">Tag number</FieldLabel>
              <Input
                id="tagNumber"
                name="tagNumber"
                defaultValue={initial?.tagNumber ?? ""}
              />
            </Field>
          )}
        </div>
        {showMaintenance && (
          <Field>
            <FieldLabel htmlFor="maintenanceNote">Maintenance note</FieldLabel>
            <textarea
              id="maintenanceNote"
              name="maintenanceNote"
              className={textareaClass}
              rows={4}
              defaultValue={initial?.maintenanceNote ?? ""}
            />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="customerName">
              Customer name
              <Req />
            </FieldLabel>
            <Input
              id="customerName"
              name="customerName"
              required
              defaultValue={initial?.customerName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="phoneNumber">
              Phone number
              <Req />
            </FieldLabel>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              required
              defaultValue={initial?.phoneNumber}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="statusId">
            Status
            <Req />
          </FieldLabel>
          <select
            id="statusId"
            name="statusId"
            required
            defaultValue={initial?.statusId}
            className={selectFieldClass}
          >
            <option value="">Select status</option>
            {lookups.statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="deliveryMethodId">
            Delivery method
            <Req />
          </FieldLabel>
          <select
            id="deliveryMethodId"
            name="deliveryMethodId"
            required
            defaultValue={initial?.deliveryMethodId}
            className={selectFieldClass}
          >
            <option value="">Select delivery method</option>
            {lookups.deliveryMethods.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>

        {customFields.length > 0 && (
          <div className="space-y-4 border-t border-border/80 pt-4">
            <p className="text-sm font-medium text-muted-foreground">
              Additional fields
            </p>
            {customFields.map((f) => (
              <Field key={f.id}>
                <FieldLabel htmlFor={`custom_${f.key}`}>
                  {f.label}
                  {f.isRequired ? <Req /> : null}
                </FieldLabel>
                {f.fieldType === "textarea" && (
                  <textarea
                    id={`custom_${f.key}`}
                    name={`custom_${f.key}`}
                    className={textareaClass}
                    rows={3}
                    required={f.isRequired}
                    defaultValue={customDefault(f.key, initialCustomData)}
                  />
                )}
                {f.fieldType === "text" && (
                  <Input
                    id={`custom_${f.key}`}
                    name={`custom_${f.key}`}
                    required={f.isRequired}
                    defaultValue={customDefault(f.key, initialCustomData)}
                  />
                )}
                {f.fieldType === "number" && (
                  <Input
                    id={`custom_${f.key}`}
                    name={`custom_${f.key}`}
                    type="number"
                    step="any"
                    required={f.isRequired}
                    defaultValue={customDefault(f.key, initialCustomData)}
                  />
                )}
                {f.fieldType === "date" && (
                  <Input
                    id={`custom_${f.key}`}
                    name={`custom_${f.key}`}
                    type="date"
                    required={f.isRequired}
                    defaultValue={customDefault(f.key, initialCustomData).slice(
                      0,
                      10,
                    )}
                  />
                )}
                {f.fieldType === "select" && (
                  <select
                    id={`custom_${f.key}`}
                    name={`custom_${f.key}`}
                    required={f.isRequired}
                    defaultValue={customDefault(f.key, initialCustomData)}
                    className={selectFieldClass}
                  >
                    <option value="">Select…</option>
                    {f.selectOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
                {!["textarea", "text", "number", "date", "select"].includes(
                  f.fieldType,
                ) && (
                  <Input
                    id={`custom_${f.key}`}
                    name={`custom_${f.key}`}
                    required={f.isRequired}
                    defaultValue={customDefault(f.key, initialCustomData)}
                  />
                )}
              </Field>
            ))}
          </div>
        )}
      </FieldGroup>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create record"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
