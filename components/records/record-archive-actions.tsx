"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { archiveRecordAction, restoreRecordAction } from "@/services/records";
import {
  confirmDanger,
  confirmNeutral,
  toastError,
  toastSuccess,
} from "@/lib/sweet-alert";
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
      await toastError("Could not archive", "error" in res ? res.error : "");
      return;
    }
    await toastSuccess("Record archived");
    router.push("/records");
    router.refresh();
  }

  async function onRestore() {
    const ok = await confirmNeutral({
      title: "Restore this record?",
      text: "It will appear in the active list again.",
      confirmText: "Restore",
    });
    if (!ok) return;
    setPending(true);
    const res = await restoreRecordAction({ recordId });
    setPending(false);
    if (!res.ok) {
      const msg =
        "error" in res && typeof res.error === "string" ? res.error : "";
      await toastError("Could not restore", msg || undefined);
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
