"use client";

import Swal from "sweetalert2";

/** Minimum visible time for toasts (ms). */
const MIN_TIMER_MS = 2000;

/** Above Radix/shadcn dialogs (`z-50`) so toasts are visible from modals. */
function raiseToastContainer() {
  const c = Swal.getContainer();
  if (c instanceof HTMLElement) {
    c.style.zIndex = "200000";
  }
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
