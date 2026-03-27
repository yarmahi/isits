/**
 * Seeds branches, statuses, and delivery_methods (Phase 3).
 * Run after migrations: npm run db:seed:lookups
 */
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { branches, deliveryMethods, statuses } from "../db/schema";

async function main() {
  const db = getDb();

  const branchRows = [
    { id: "br-main", name: "Main office" },
    { id: "br-warehouse", name: "Warehouse" },
  ];
  for (const b of branchRows) {
    const [x] = await db.select().from(branches).where(eq(branches.id, b.id)).limit(1);
    if (!x) {
      await db.insert(branches).values({
        id: b.id,
        name: b.name,
        isActive: true,
      });
      console.log("Inserted branch", b.id);
    }
  }

  const statusRows = [
    { id: "st-received", name: "Received", code: "received", sortOrder: 10 },
    { id: "st-in_progress", name: "In Progress", code: "in_progress", sortOrder: 20 },
    { id: "st-waiting", name: "Waiting", code: "waiting", sortOrder: 30 },
    { id: "st-ready", name: "Ready for Return", code: "ready_for_return", sortOrder: 40 },
    { id: "st-returned", name: "Returned", code: "returned", sortOrder: 50 },
    { id: "st-cancelled", name: "Cancelled", code: "cancelled", sortOrder: 60 },
  ];
  for (const s of statusRows) {
    const [x] = await db.select().from(statuses).where(eq(statuses.id, s.id)).limit(1);
    if (!x) {
      await db.insert(statuses).values({
        id: s.id,
        name: s.name,
        code: s.code,
        sortOrder: s.sortOrder,
        isActive: true,
      });
      console.log("Inserted status", s.id);
    }
  }

  const dmRows = [
    { id: "dm-physical", name: "Physical", code: "physical", sortOrder: 10 },
    { id: "dm-by_car", name: "By car", code: "by_car", sortOrder: 20 },
  ];
  for (const d of dmRows) {
    const [x] = await db
      .select()
      .from(deliveryMethods)
      .where(eq(deliveryMethods.id, d.id))
      .limit(1);
    if (!x) {
      await db.insert(deliveryMethods).values({
        id: d.id,
        name: d.name,
        code: d.code,
        sortOrder: d.sortOrder,
        isActive: true,
      });
      console.log("Inserted delivery method", d.id);
    }
  }

  console.log("Lookup seed done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
