import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/** Runs a trivial query when DATABASE_URL is set; returns false on failure or missing config. */
export async function checkDatabase(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) {
      return false;
    }
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
