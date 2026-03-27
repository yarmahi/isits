import { redirect } from "next/navigation";

/** Default settings entry: open Branches (Chapter 2 Phase A). */
export default function SettingsPage() {
  redirect("/settings/branches");
}
