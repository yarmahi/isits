import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchRecordLookups } from "@/services/records";
import { RecordForm } from "@/components/records/record-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/lib/permissions";

/** Create a new intake record (Phase 3). */
export default async function NewRecordPage() {
  await requireAuth();
  const lookups = await fetchRecordLookups();
  const defaultDateReceived = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/records"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to records
        </Link>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New record</h1>
        <p className="text-sm text-muted-foreground">
          Enter the details from intake. Record number is assigned when you save.
        </p>
      </div>
      <RecordForm
        mode="create"
        lookups={lookups}
        defaultDateReceived={defaultDateReceived}
      />
    </div>
  );
}
