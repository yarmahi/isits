import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Returns the current Better Auth session or null. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
