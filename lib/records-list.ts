import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { records } from "@/db/schema";

export const DEFAULT_PAGE_SIZE = 10;

export type RecordsScope = "active" | "archived" | "all";

export type RecordsSort =
  | "created_desc"
  | "created_asc"
  | "record_no_asc"
  | "record_no_desc"
  | "customer_asc";

export type RecordsListParsed = {
  page: number;
  pageSize: number;
  q: string;
  branchId: string;
  statusId: string;
  deliveryMethodId: string;
  dateReceivedFrom: string;
  dateReceivedTo: string;
  dateReturnedFrom: string;
  dateReturnedTo: string;
  scope: RecordsScope;
  createdBy: string;
  updatedBy: string;
  mine: boolean;
  sort: RecordsSort;
};

function getFirst(
  sp: Record<string, string | string[] | undefined>,
  k: string,
): string | undefined {
  const v = sp[k];
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
}

function parseScope(v: string | undefined): RecordsScope {
  if (v === "archived" || v === "all") return v;
  return "active";
}

function parseSort(v: string | undefined): RecordsSort {
  const allowed: RecordsSort[] = [
    "created_desc",
    "created_asc",
    "record_no_asc",
    "record_no_desc",
    "customer_asc",
  ];
  if (v && (allowed as string[]).includes(v)) return v as RecordsSort;
  return "created_desc";
}

/** Escape `%`, `_`, `\` for PostgreSQL ILIKE patterns. */
export function escapeLikePattern(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Parse URL search params for the records list (GET). */
export function parseRecordsListParams(
  sp: Record<string, string | string[] | undefined>,
): RecordsListParsed {
  const pageRaw = parseInt(getFirst(sp, "page") ?? "1", 10) || 1;
  const pageSizeRaw =
    parseInt(getFirst(sp, "pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) ||
    DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(50, Math.max(5, pageSizeRaw));
  const mine = getFirst(sp, "mine") === "1";

  return {
    page: Math.max(1, pageRaw),
    pageSize,
    q: (getFirst(sp, "q") ?? "").trim(),
    branchId: (getFirst(sp, "branchId") ?? "").trim(),
    statusId: (getFirst(sp, "statusId") ?? "").trim(),
    deliveryMethodId: (getFirst(sp, "deliveryMethodId") ?? "").trim(),
    dateReceivedFrom: (getFirst(sp, "dateReceivedFrom") ?? "").trim(),
    dateReceivedTo: (getFirst(sp, "dateReceivedTo") ?? "").trim(),
    dateReturnedFrom: (getFirst(sp, "dateReturnedFrom") ?? "").trim(),
    dateReturnedTo: (getFirst(sp, "dateReturnedTo") ?? "").trim(),
    scope: parseScope(getFirst(sp, "scope")),
    createdBy: (getFirst(sp, "createdBy") ?? "").trim(),
    updatedBy: (getFirst(sp, "updatedBy") ?? "").trim(),
    mine,
    sort: parseSort(getFirst(sp, "sort")),
  };
}

/** Build `/records?…` preserving filters and pagination. */
export function buildRecordsListUrl(
  base: RecordsListParsed,
  overrides: Partial<RecordsListParsed> & { page?: number },
): string {
  const p = { ...base, ...overrides };
  const usp = new URLSearchParams();

  if (p.page > 1) usp.set("page", String(p.page));
  if (p.pageSize !== DEFAULT_PAGE_SIZE) usp.set("pageSize", String(p.pageSize));
  if (p.q) usp.set("q", p.q);
  if (p.branchId) usp.set("branchId", p.branchId);
  if (p.statusId) usp.set("statusId", p.statusId);
  if (p.deliveryMethodId) usp.set("deliveryMethodId", p.deliveryMethodId);
  if (p.dateReceivedFrom) usp.set("dateReceivedFrom", p.dateReceivedFrom);
  if (p.dateReceivedTo) usp.set("dateReceivedTo", p.dateReceivedTo);
  if (p.dateReturnedFrom) usp.set("dateReturnedFrom", p.dateReturnedFrom);
  if (p.dateReturnedTo) usp.set("dateReturnedTo", p.dateReturnedTo);
  if (p.scope !== "active") usp.set("scope", p.scope);
  if (p.createdBy) usp.set("createdBy", p.createdBy);
  if (p.updatedBy) usp.set("updatedBy", p.updatedBy);
  if (p.mine) usp.set("mine", "1");
  if (p.sort !== "created_desc") usp.set("sort", p.sort);

  const s = usp.toString();
  return s ? `/records?${s}` : "/records";
}

export function recordsListOrderBy(sort: RecordsSort) {
  switch (sort) {
    case "created_asc":
      return [asc(records.createdAt)];
    case "record_no_asc":
      return [asc(records.recordNo)];
    case "record_no_desc":
      return [desc(records.recordNo)];
    case "customer_asc":
      return [asc(records.customerName)];
    case "created_desc":
    default:
      return [desc(records.createdAt)];
  }
}

type ListCtx = {
  userId: string;
  isManager: boolean;
};

/** Drizzle WHERE for records list (server-side). */
export function buildRecordsListWhere(
  parsed: RecordsListParsed,
  ctx: ListCtx,
): SQL | undefined {
  const conditions: SQL[] = [];

  if (!ctx.isManager) {
    conditions.push(eq(records.createdBy, ctx.userId));
  } else {
    if (parsed.mine) {
      conditions.push(eq(records.createdBy, ctx.userId));
    } else if (parsed.createdBy) {
      conditions.push(eq(records.createdBy, parsed.createdBy));
    }
    if (parsed.updatedBy) {
      conditions.push(eq(records.updatedBy, parsed.updatedBy));
    }
  }

  if (parsed.scope === "active") {
    conditions.push(isNull(records.deletedAt));
  } else if (parsed.scope === "archived") {
    conditions.push(isNotNull(records.deletedAt));
  }

  if (parsed.q) {
    const pattern = `%${escapeLikePattern(parsed.q)}%`;
    conditions.push(
      or(
        ilike(records.recordNo, pattern),
        ilike(records.customerName, pattern),
        ilike(records.serialNumber, pattern),
        ilike(records.tagNumber, pattern),
        ilike(records.pcModel, pattern),
        sql`${records.customData}::text ILIKE ${pattern}`,
      )!,
    );
  }

  if (parsed.branchId) {
    conditions.push(eq(records.branchId, parsed.branchId));
  }
  if (parsed.statusId) {
    conditions.push(eq(records.statusId, parsed.statusId));
  }
  if (parsed.deliveryMethodId) {
    conditions.push(eq(records.deliveryMethodId, parsed.deliveryMethodId));
  }

  if (parsed.dateReceivedFrom) {
    conditions.push(gte(records.dateReceived, parsed.dateReceivedFrom));
  }
  if (parsed.dateReceivedTo) {
    conditions.push(lte(records.dateReceived, parsed.dateReceivedTo));
  }

  if (parsed.dateReturnedFrom) {
    conditions.push(gte(records.dateReturned, parsed.dateReturnedFrom));
  }
  if (parsed.dateReturnedTo) {
    conditions.push(lte(records.dateReturned, parsed.dateReturnedTo));
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

/** True when any filter beyond search / per-page defaults is active (for UI: expand advanced). */
export function hasAdvancedRecordFilters(parsed: RecordsListParsed): boolean {
  if (parsed.branchId) return true;
  if (parsed.statusId) return true;
  if (parsed.deliveryMethodId) return true;
  if (parsed.dateReceivedFrom) return true;
  if (parsed.dateReceivedTo) return true;
  if (parsed.dateReturnedFrom) return true;
  if (parsed.dateReturnedTo) return true;
  if (parsed.scope !== "active") return true;
  if (parsed.sort !== "created_desc") return true;
  if (parsed.mine) return true;
  if (parsed.createdBy) return true;
  if (parsed.updatedBy) return true;
  return false;
}
