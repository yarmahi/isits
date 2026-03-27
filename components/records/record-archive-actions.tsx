"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";
import { archiveRecordAction, restoreRecordAction } from "@/services/records";
import { toastError, toastSuccess } from "@/lib/sweet-alert";
import { Button } from "@/components/ui/button";

type Props = {
  recordId: string;
  archived: boolean;
};

/** Manager-only archive / restore with confirmation. */
export function RecordArchiveActions({ recordId, archived }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onArchive() {
    const r = await Swal.fire({
      title: "Archive this record?",
      text: "It will be hidden from the default list until restored.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Archive",
    });
    if (!r.isConfirmed) return;
    setPending(true);
    const res = await archiveRecordAction({ recordId });
    setPending(false);
    if (!res.ok) {
      await toastError("Could not archive", "error" in res ? res.error : "");
      return;
    }
    await toastSuccess("Record archived");
    router.push("/records");
    router.refresh();
  }

  async function onRestore() {
    const r = await Swal.fire({
      title: "Restore this record?",
      text: "It will appear in the active list again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Restore",
    });
    if (!r.isConfirmed) return;
    setPending(true);
    const res = await restoreRecordAction({ recordId });
    setPending(false);
    if (!res.ok) {
      await toastError("Could not restore", "error" in res ? res.error : "");
      return;
    }
    await toastSuccess("Record restored");
    router.refresh();
  }

  if (archived) {
    return (
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => void onRestore()}
      >
        {pending ? "Restoring…" : "Restore record"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => void onArchive()}
    >
      {pending ? "Archiving…" : "Archive record"}
    </Button>
  );
}
