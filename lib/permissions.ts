import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/** Redirects to login if unauthenticated; returns the session otherwise. */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Ensures the user is a manager or redirects away. */
export async function requireManager() {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  if (role !== "manager") {
    redirect("/records");
  }
  return session;
}
