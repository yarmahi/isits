import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activityLogs, user } from "@/db/schema";

export type RecordActivityEntry = {
  id: string;
  createdAt: Date;
  eventType: string;
  actorDisplayName: string | null;
};

const RECORD_EVENT_LABELS: Record<string, string> = {
  record_create: "Record created",
  record_update: "Record updated",
  record_archive: "Archived",
  record_restore: "Restored",
};

/** Short label for activity_logs.event_type (record-scoped UI). */
export function formatRecordEventLabel(eventType: string): string {
  const mapped = RECORD_EVENT_LABELS[eventType];
  if (mapped) return mapped;
  return eventType
    .replace(/^record_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Audit rows for this record, newest first (entity_type = record, entity_id = id). */
export async function getRecordActivityEntries(
  recordId: string,
): Promise<RecordActivityEntry[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: activityLogs.id,
      createdAt: activityLogs.createdAt,
      eventType: activityLogs.eventType,
      actorName: user.name,
    })
    .from(activityLogs)
    .leftJoin(user, eq(activityLogs.actorUserId, user.id))
    .where(
      and(
        eq(activityLogs.entityType, "record"),
        eq(activityLogs.entityId, recordId),
      ),
    )
    .orderBy(desc(activityLogs.createdAt));

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    eventType: r.eventType,
    actorDisplayName: r.actorName,
  }));
}
