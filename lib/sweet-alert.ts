"use client";

import Swal from "sweetalert2";

/** Minimum visible time for toasts (ms). */
const MIN_TIMER_MS = 2000;

/** Above Radix/shadcn dialogs (`z-50`) so toasts and confirms stay on top. */
export function raiseSwalZIndex() {
  const c = Swal.getContainer();
  if (c instanceof HTMLElement) {
    c.style.zIndex = "200000";
  }
}

function raiseToastContainer() {
  raiseSwalZIndex();
}

/** Confirm destructive or irreversible actions (archive, delete). */
export async function confirmDanger(opts: {
  title: string;
  text?: string;
  confirmText?: string;
}): Promise<boolean> {
  const r = await Swal.fire({
    title: opts.title,
    text: opts.text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? "Confirm",
    cancelButtonText: "Cancel",
    focusCancel: true,
    didOpen: raiseSwalZIndex,
  });
  return r.isConfirmed;
}

/** Confirm neutral actions (restore, etc.). */
export async function confirmNeutral(opts: {
  title: string;
  text?: string;
  confirmText?: string;
}): Promise<boolean> {
  const r = await Swal.fire({
    title: opts.title,
    text: opts.text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? "Confirm",
    cancelButtonText: "Cancel",
    focusCancel: true,
    didOpen: raiseSwalZIndex,
  });
  return r.isConfirmed;
}

export function toastSuccess(title: string, text?: string) {
  return Swal.fire({
    icon: "success",
    title,
    text,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: MIN_TIMER_MS,
    timerProgressBar: true,
    didOpen: raiseToastContainer,
  });
}

export function toastError(title: string, text?: string) {
  return Swal.fire({
    icon: "error",
    title,
    text,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: MIN_TIMER_MS,
    timerProgressBar: true,
    didOpen: raiseToastContainer,
  });
}

export function toastWarning(title: string, text?: string) {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: MIN_TIMER_MS,
    timerProgressBar: true,
    didOpen: raiseToastContainer,
  });
}
