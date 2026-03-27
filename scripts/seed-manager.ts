import * as dotenv from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";
import { account, user } from "../db/schema";
import { syntheticEmailFromUsername } from "../lib/user-helpers";

dotenv.config({ path: ".env.local" });
dotenv.config();

/** Inserts the initial manager user if none exists (run: npm run db:seed). */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const uname = (process.env.SEED_MANAGER_USERNAME ?? "manager")
    .trim()
    .toLowerCase();
  const password = process.env.SEED_MANAGER_PASSWORD ?? "123456";
  const name = process.env.SEED_MANAGER_NAME ?? "System Manager";
  const email = syntheticEmailFromUsername(uname);

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, uname))
    .limit(1);
  if (existing.length > 0) {
    console.log("Manager username already exists:", uname);
    await pool.end();
    return;
  }

  const id = randomUUID();
  const hashed = await hashPassword(password);
  await db.insert(user).values({
    id,
    name,
    email,
    username: uname,
    displayUsername: uname,
    emailVerified: true,
    role: "manager",
    isActive: true,
  });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: uname,
    providerId: "credential",
    userId: id,
    password: hashed,
  });

  console.log("Seeded manager username:", uname);
  console.log(
    "Sign in with this username and SEED_MANAGER_PASSWORD (default 123456).",
  );
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
