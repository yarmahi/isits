"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toastSuccess } from "@/lib/sweet-alert";

/** Prevents duplicate toasts under React Strict Mode double-invoke. */
let recordCreatedToastLock = false;

/** After create redirect `?created=1`, show toast and strip the query param. */
export function RecordsCreatedToast() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("created") !== "1") {
      recordCreatedToastLock = false;
      return;
    }
    if (recordCreatedToastLock) return;
    recordCreatedToastLock = true;
    void toastSuccess("Record created");
    router.replace("/records");
  }, [router, searchParams]);

  return null;
}
