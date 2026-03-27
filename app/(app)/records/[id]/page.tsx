import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Pencil } from "lucide-react";
import { getDb } from "@/db";
import {
  branches,
  deliveryMethods,
  records,
  statuses,
  user as userTable,
} from "@/db/schema";
import { loadRecordFieldConfig } from "@/lib/record-field-config";
import { requireAuth } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { RecordArchiveActions } from "@/components/records/record-archive-actions";

const creator = alias(userTable, "creator");
const updater = alias(userTable, "updater");

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

/** Record detail with metadata (Phase 3). */
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
      creatorName: creator.name,
      updaterName: updater.name,
    })
    .from(records)
    .innerJoin(branches, eq(records.branchId, branches.id))
    .innerJoin(statuses, eq(records.statusId, statuses.id))
    .innerJoin(deliveryMethods, eq(records.deliveryMethodId, deliveryMethods.id))
    .innerJoin(creator, eq(records.createdBy, creator.id))
    .innerJoin(updater, eq(records.updatedBy, updater.id))
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

      <div className="grid gap-6 rounded-xl border border-border/80 bg-card p-6 shadow-sm md:grid-cols-2">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Date received</dt>
            <dd className="font-medium">{fmtDate(r.dateReceived)}</dd>
          </div>
          {fieldCfg.systemVisibility.dateReturned && (
            <div>
              <dt className="text-muted-foreground">Date returned</dt>
              <dd className="font-medium">{fmtDate(r.dateReturned)}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Branch</dt>
            <dd className="font-medium">{row.branchName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{row.statusName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="font-medium">{row.deliveryName}</dd>
          </div>
        </dl>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">PC model</dt>
            <dd className="font-medium">{r.pcModel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Serial number</dt>
            <dd className="font-mono text-xs">{r.serialNumber}</dd>
          </div>
          {fieldCfg.systemVisibility.tagNumber && (
            <div>
              <dt className="text-muted-foreground">Tag number</dt>
              <dd className="font-mono text-xs">{r.tagNumber ?? "—"}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{r.phoneNumber}</dd>
          </div>
          {fieldCfg.systemVisibility.maintenanceNote && (
            <div>
              <dt className="text-muted-foreground">Maintenance note</dt>
              <dd className="whitespace-pre-wrap text-muted-foreground">
                {r.maintenanceNote ?? "—"}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {fieldCfg.customFields.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">
            Additional fields
          </h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {fieldCfg.customFields.map((f) => (
              <div key={f.id}>
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="mt-0.5 font-medium whitespace-pre-wrap">
                  {fmtCustomVal(customData[f.key])}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="rounded-xl border border-border/80 bg-muted/30 p-4 text-sm">
        <h2 className="mb-2 font-medium">Activity</h2>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Created by</dt>
            <dd>{row.creatorName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Updated by</dt>
            <dd>{row.updaterName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created at</dt>
            <dd>{r.createdAt.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Updated at</dt>
            <dd>{r.updatedAt.toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
