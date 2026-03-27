import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { activityLogs, user } from "@/db/schema";
import { escapeLikePattern } from "@/lib/records-list";

export const ACTIVITY_DEFAULT_PAGE_SIZE = 25;

export type ActivityListParsed = {
  page: number;
  pageSize: number;
  q: string;
  eventType: string;
  entityType: string;
  actorId: string;
  entityId: string;
  ip: string;
  dateFrom: string;
  dateTo: string;
};

function getFirst(
  sp: Record<string, string | string[] | undefined>,
  k: string,
): string | undefined {
  const v = sp[k];
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
}

export function parseActivityListParams(
  sp: Record<string, string | string[] | undefined>,
): ActivityListParsed {
  const pageRaw = parseInt(getFirst(sp, "page") ?? "1", 10) || 1;
  const pageSizeRaw =
    parseInt(
      getFirst(sp, "pageSize") ?? String(ACTIVITY_DEFAULT_PAGE_SIZE),
      10,
    ) || ACTIVITY_DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(100, Math.max(10, pageSizeRaw));
  return {
    page: Math.max(1, pageRaw),
    pageSize,
    q: (getFirst(sp, "q") ?? "").trim(),
    eventType: (getFirst(sp, "eventType") ?? "").trim(),
    entityType: (getFirst(sp, "entityType") ?? "").trim(),
    actorId: (getFirst(sp, "actorId") ?? "").trim(),
    entityId: (getFirst(sp, "entityId") ?? "").trim(),
    ip: (getFirst(sp, "ip") ?? "").trim(),
    dateFrom: (getFirst(sp, "dateFrom") ?? "").trim(),
    dateTo: (getFirst(sp, "dateTo") ?? "").trim(),
  };
}

export function buildActivityListUrl(
  base: ActivityListParsed,
  overrides: Partial<ActivityListParsed> & { page?: number },
): string {
  const p = { ...base, ...overrides };
  const usp = new URLSearchParams();
  if (p.page > 1) usp.set("page", String(p.page));
  if (p.pageSize !== ACTIVITY_DEFAULT_PAGE_SIZE) {
    usp.set("pageSize", String(p.pageSize));
  }
  if (p.q) usp.set("q", p.q);
  if (p.eventType) usp.set("eventType", p.eventType);
  if (p.entityType) usp.set("entityType", p.entityType);
  if (p.actorId) usp.set("actorId", p.actorId);
  if (p.entityId) usp.set("entityId", p.entityId);
  if (p.ip) usp.set("ip", p.ip);
  if (p.dateFrom) usp.set("dateFrom", p.dateFrom);
  if (p.dateTo) usp.set("dateTo", p.dateTo);
  const s = usp.toString();
  return s ? `/activity?${s}` : "/activity";
}

export function buildActivityWhere(parsed: ActivityListParsed): SQL | undefined {
  const conditions: SQL[] = [];
  if (parsed.eventType) {
    conditions.push(eq(activityLogs.eventType, parsed.eventType));
  }
  if (parsed.entityType) {
    conditions.push(eq(activityLogs.entityType, parsed.entityType));
  }
  if (parsed.actorId) {
    conditions.push(eq(activityLogs.actorUserId, parsed.actorId));
  }
  if (parsed.entityId) {
    conditions.push(eq(activityLogs.entityId, parsed.entityId));
  }
  if (parsed.ip) {
    const pat = `%${escapeLikePattern(parsed.ip)}%`;
    conditions.push(ilike(activityLogs.ipAddress, pat));
  }
  if (parsed.dateFrom) {
    conditions.push(gte(activityLogs.createdAt, new Date(parsed.dateFrom)));
  }
  if (parsed.dateTo) {
    const end = new Date(parsed.dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(activityLogs.createdAt, end));
  }
  if (parsed.q) {
    const pat = `%${escapeLikePattern(parsed.q)}%`;
    conditions.push(
      or(
        ilike(activityLogs.eventType, pat),
        ilike(activityLogs.entityType, pat),
        ilike(activityLogs.entityId, pat),
        ilike(activityLogs.route, pat),
        ilike(activityLogs.url, pat),
        ilike(activityLogs.ipAddress, pat),
      )!,
    );
  }
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

/** True when any filter beyond search (`q`) / default paging is active. */
export function hasAdvancedActivityFilters(
  parsed: ActivityListParsed,
): boolean {
  if (parsed.eventType) return true;
  if (parsed.entityType) return true;
  if (parsed.actorId) return true;
  if (parsed.entityId) return true;
  if (parsed.ip) return true;
  if (parsed.dateFrom) return true;
  if (parsed.dateTo) return true;
  return false;
}

export const ACTIVITY_EVENT_TYPES = [
  { value: "", label: "All events" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "page_view", label: "Page view" },
  { value: "record_create", label: "Record create" },
  { value: "record_update", label: "Record update" },
  { value: "record_archive", label: "Record archive" },
  { value: "record_restore", label: "Record restore" },
  { value: "user_create", label: "User create" },
  { value: "user_update", label: "User update" },
  { value: "user_activate", label: "User activate" },
  { value: "user_deactivate", label: "User deactivate" },
] as const;

export const ACTIVITY_ENTITY_TYPES = [
  { value: "", label: "All entities" },
  { value: "session", label: "Session" },
  { value: "record", label: "Record" },
  { value: "user", label: "User" },
  { value: "route", label: "Route" },
] as const;
