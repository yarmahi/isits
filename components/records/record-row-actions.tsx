"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { archiveRecordAction } from "@/services/records";
import { confirmDanger, toastError, toastSuccess } from "@/lib/sweet-alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
type Props = {
  recordId: string;
  canEdit: boolean;
  canArchive: boolean;
};

/** View / edit / archive (delete) actions for a record row. */
export function RecordRowActions({ recordId, canEdit, canArchive }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onArchive() {
    const ok = await confirmDanger({
      title: "Archive this record?",
      text: "It will be hidden from the default list until restored.",
      confirmText: "Archive",
    });
    if (!ok) return;
    setPending(true);
    const res = await archiveRecordAction({ recordId });
    setPending(false);
    if (!res.ok) {
      const msg =
        "error" in res && typeof res.error === "string" ? res.error : "";
      await toastError("Could not archive", msg || undefined);
      return;
    }
    await toastSuccess("Record archived");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
        <Link
          href={`/records/${recordId}`}
          aria-label="View record"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
        <Eye className="size-4" />
      </Link>
      {canEdit && (
        <Link
          href={`/records/${recordId}/edit`}
          aria-label="Edit record"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <Pencil className="size-4" />
        </Link>
      )}
      {canArchive && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          aria-label="Archive record"
          onClick={() => void onArchive()}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
