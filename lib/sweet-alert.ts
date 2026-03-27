"use client";

import Swal from "sweetalert2";

/** Minimum visible time for toasts (ms). */
const MIN_TIMER_MS = 2000;

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
  });
}
