import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq, and, isNull } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { getDb } from "@/db";
import { records } from "@/db/schema";
import { loadRecordFieldConfig } from "@/lib/record-field-config";
import { requireAuth } from "@/lib/permissions";
import { fetchRecordLookups } from "@/services/records";
import { RecordForm } from "@/components/records/record-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

function fmtDate(v: string | Date | null | undefined) {
  if (v == null) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

/** Edit record (specialist: own only; manager: any). */
export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const db = getDb();
  const [row] = await db
    .select()
    .from(records)
    .where(and(eq(records.id, id), isNull(records.deletedAt)))
    .limit(1);

  if (!row) notFound();
  if (role !== "manager" && row.createdBy !== userId) {
    redirect("/records");
  }

  const [lookups, fieldCfg] = await Promise.all([
    fetchRecordLookups(),
    loadRecordFieldConfig(),
  ]);

  const initial = {
    recordId: row.id,
    recordNo: row.recordNo,
    dateReceived: fmtDate(row.dateReceived),
    dateReturned: fmtDate(row.dateReturned),
    branchId: row.branchId,
    pcModel: row.pcModel,
    serialNumber: row.serialNumber,
    tagNumber: row.tagNumber ?? "",
    maintenanceNote: row.maintenanceNote ?? "",
    customerName: row.customerName,
    phoneNumber: row.phoneNumber,
    statusId: row.statusId,
    deliveryMethodId: row.deliveryMethodId,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/records/${id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to record
        </Link>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Edit record</h1>
        <p className="text-sm text-muted-foreground">Update record</p>
      </div>
      <RecordForm
        mode="edit"
        lookups={lookups}
        initial={initial}
        systemVisibility={fieldCfg.systemVisibility}
        customFields={fieldCfg.customFields}
        initialCustomData={
          (row.customData as Record<string, unknown> | null) ?? undefined
        }
      />
    </div>
  );
}
