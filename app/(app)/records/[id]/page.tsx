import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import { getDb } from "@/db";
import { branches, deliveryMethods, records, statuses } from "@/db/schema";
import { loadRecordFieldConfig } from "@/lib/record-field-config";
import { requireAuth } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { RecordArchiveActions } from "@/components/records/record-archive-actions";
import {
  RecordActivityTimeline,
  RecordActivityTimelineSkeleton,
} from "@/components/records/record-activity-timeline";

function fmtDate(v: string | Date | null | undefined) {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  return v.toISOString().slice(0, 10);
}

function fmtCustomVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function FieldRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 sm:col-span-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 break-words font-medium text-foreground",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** Record detail: two-column layout with audit timeline (Chapter 2 Phase F). */
export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const isManager = role === "manager";

  const db = getDb();
  const [row] = await db
    .select({
      record: records,
      branchName: branches.name,
      statusName: statuses.name,
      deliveryName: deliveryMethods.name,
    })
    .from(records)
    .innerJoin(branches, eq(records.branchId, branches.id))
    .innerJoin(statuses, eq(records.statusId, statuses.id))
    .innerJoin(deliveryMethods, eq(records.deliveryMethodId, deliveryMethods.id))
    .where(eq(records.id, id))
    .limit(1);

  if (!row) notFound();
  if (role !== "manager" && row.record.createdBy !== userId) {
    redirect("/records");
  }

  const fieldCfg = await loadRecordFieldConfig();
  const r = row.record;
  const customData = (r.customData as Record<string, unknown> | null) ?? {};
  const archived = r.deletedAt != null;
  const canEdit =
    isManager || (!archived && r.createdBy === userId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="font-mono text-sm text-muted-foreground">{r.recordNo}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {r.customerName}
          </h1>
          {archived && (
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Archived
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && !archived && (
            <Link
              href={`/records/${id}/edit`}
              className={cn(buttonVariants({ variant: "default" }), "gap-2")}
            >
              <Pencil className="size-4" aria-hidden />
              Edit
            </Link>
          )}
          {isManager && (
            <RecordArchiveActions recordId={id} archived={archived} />
          )}
          <Link
            href="/records"
            className={buttonVariants({ variant: "outline" })}
          >
            All records
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <DetailSection title="Intake & routing">
            <FieldRow label="Date received" value={fmtDate(r.dateReceived)} />
            {fieldCfg.systemVisibility.dateReturned && (
              <FieldRow label="Date returned" value={fmtDate(r.dateReturned)} />
            )}
            <FieldRow label="Branch" value={row.branchName} />
            <FieldRow label="Status" value={row.statusName} />
            <FieldRow label="Delivery method" value={row.deliveryName} />
          </DetailSection>

          <DetailSection title="Equipment">
            <FieldRow label="PC model" value={r.pcModel} />
            <FieldRow label="Serial number" value={r.serialNumber} mono />
            {fieldCfg.systemVisibility.tagNumber && (
              <FieldRow label="Tag number" value={r.tagNumber ?? "—"} mono />
            )}
            {fieldCfg.systemVisibility.maintenanceNote && (
              <FieldRow
                label="Maintenance note"
                value={
                  r.maintenanceNote ? (
                    <span className="whitespace-pre-wrap font-normal text-muted-foreground">
                      {r.maintenanceNote}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            )}
          </DetailSection>

          <DetailSection title="Customer">
            <FieldRow label="Name" value={r.customerName} />
            <FieldRow label="Phone" value={r.phoneNumber} />
          </DetailSection>

          {fieldCfg.customFields.length > 0 && (
            <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground">
                Additional fields
              </h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {fieldCfg.customFields.map((f) => (
                  <FieldRow
                    key={f.id}
                    label={f.label}
                    value={
                      <span className="whitespace-pre-wrap">
                        {fmtCustomVal(customData[f.key])}
                      </span>
                    }
                  />
                ))}
              </dl>
            </section>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <Suspense fallback={<RecordActivityTimelineSkeleton />}>
            <RecordActivityTimeline recordId={id} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
