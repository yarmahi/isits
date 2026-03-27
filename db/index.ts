import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

let pool: Pool | undefined;

/** Returns a Drizzle client backed by a shared pg Pool (Neon-compatible URL). */
export function getDb() {
  const { DATABASE_URL } = getServerEnv();
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL });
  }
  return drizzle(pool, { schema });
}
