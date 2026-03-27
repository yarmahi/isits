"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRecordAction, updateRecordAction } from "@/services/records";
import { toastError, toastSuccess } from "@/lib/sweet-alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
};

const textareaClass =
  "flex min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30";

/** Create / edit form for intake records (Phase 3). */
export function RecordForm({ mode, lookups, initial }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
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
      await toastError("Could not save", "error" in res ? res.error : "Unknown error");
      return;
    }
    await toastSuccess(mode === "create" ? "Record created" : "Record saved");
    if (mode === "create" && "recordId" in res) {
      router.push(`/records/${res.recordId}`);
    } else {
      router.push(`/records/${initial!.recordId}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      {mode === "edit" && initial && (
        <p className="text-sm text-muted-foreground">
          Record number:{" "}
          <span className="font-mono font-medium text-foreground">
            {initial.recordNo}
          </span>
        </p>
      )}
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="dateReceived">Date received</FieldLabel>
            <Input
              id="dateReceived"
              name="dateReceived"
              type="date"
              required
              defaultValue={initial?.dateReceived}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="dateReturned">Date returned</FieldLabel>
            <Input
              id="dateReturned"
              name="dateReturned"
              type="date"
              defaultValue={initial?.dateReturned || ""}
            />
            <FieldDescription>Optional until returned.</FieldDescription>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="branchId">Branch</FieldLabel>
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
          <FieldLabel htmlFor="pcModel">PC model</FieldLabel>
          <Input
            id="pcModel"
            name="pcModel"
            required
            defaultValue={initial?.pcModel}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="serialNumber">Serial number</FieldLabel>
            <Input
              id="serialNumber"
              name="serialNumber"
              required
              defaultValue={initial?.serialNumber}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="tagNumber">Tag number</FieldLabel>
            <Input
              id="tagNumber"
              name="tagNumber"
              defaultValue={initial?.tagNumber ?? ""}
            />
          </Field>
        </div>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="customerName">Customer name</FieldLabel>
            <Input
              id="customerName"
              name="customerName"
              required
              defaultValue={initial?.customerName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              required
              defaultValue={initial?.phoneNumber}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="statusId">Status</FieldLabel>
          <select
            id="statusId"
            name="statusId"
            required
            defaultValue={initial?.statusId}
            className="flex h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
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
          <FieldLabel htmlFor="deliveryMethodId">Delivery method</FieldLabel>
          <select
            id="deliveryMethodId"
            name="deliveryMethodId"
            required
            defaultValue={initial?.deliveryMethodId}
            className="flex h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          >
            <option value="">Select delivery method</option>
            {lookups.deliveryMethods.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
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
