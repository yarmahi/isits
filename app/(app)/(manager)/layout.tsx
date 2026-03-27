import { requireManager } from "@/lib/permissions";

/** Restricts child routes to manager role (server-side). */
export default async function ManagerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireManager();
  return children;
}
