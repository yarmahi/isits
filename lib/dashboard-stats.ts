import { and, count, eq, gte, isNull, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { records, statuses, user } from "@/db/schema";

export type DashboardStats = {
  thisWeekRecords: number;
  lastWeekRecords: number;
  activeUsers: number;
  statusCounts: { name: string; count: number }[];
  last7Days: { label: string; count: number }[];
};

function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Aggregates for the home dashboard (non-archived records). */
export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const now = new Date();
  const thisWeekStart = startOfWeekMonday(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const [thisWeekRow] = await db
    .select({ c: count() })
    .from(records)
    .where(
      and(
        isNull(records.deletedAt),
        gte(records.createdAt, thisWeekStart),
      ),
    );

  const [lastWeekRow] = await db
    .select({ c: count() })
    .from(records)
    .where(
      and(
        isNull(records.deletedAt),
        gte(records.createdAt, lastWeekStart),
        lt(records.createdAt, thisWeekStart),
      ),
    );

  const [activeUsersRow] = await db
    .select({ c: count() })
    .from(user)
    .where(eq(user.isActive, true));

  const statusRows = await db
    .select({ name: statuses.name, c: count() })
    .from(records)
    .innerJoin(statuses, eq(records.statusId, statuses.id))
    .where(isNull(records.deletedAt))
    .groupBy(statuses.id, statuses.name);

  const last7Days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const [row] = await db
      .select({ c: count() })
      .from(records)
      .where(
        and(
          isNull(records.deletedAt),
          gte(records.createdAt, day),
          lt(records.createdAt, next),
        ),
      );
    last7Days.push({
      label: day.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      count: Number(row?.c ?? 0),
    });
  }

  return {
    thisWeekRecords: Number(thisWeekRow?.c ?? 0),
    lastWeekRecords: Number(lastWeekRow?.c ?? 0),
    activeUsers: Number(activeUsersRow?.c ?? 0),
    statusCounts: statusRows.map((r) => ({
      name: r.name,
      count: Number(r.c ?? 0),
    })),
    last7Days,
  };
}
