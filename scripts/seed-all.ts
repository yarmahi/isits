/**
 * Runs lookup, manager, and field-definition seeds in order.
 * Requires DATABASE_URL and completed migrations.
 */
import { execSync } from "node:child_process";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

function run(label: string, script: string) {
  console.log(`\n--- ${label} ---`);
  execSync(`npx tsx ${script}`, { stdio: "inherit", cwd: process.cwd() });
}

function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  run("Lookups (branches, statuses, delivery methods)", "scripts/seed-lookups.ts");
  run("Manager account", "scripts/seed-manager.ts");
  run("Field definitions", "scripts/seed-field-definitions.ts");
  console.log("\nAll seeds finished.");
}

main();
