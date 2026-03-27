import Link from "next/link";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { Plus } from "lucide-react";
import { getDb } from "@/db";
import { records, statuses } from "@/db/schema";
import { requireAuth } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_PAGE_SIZE = 10;

function parseSearchParams(sp: Record<string, string | string[] | undefined>) {
  const get = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  };
  const pageRaw = parseInt(get("page") ?? "1", 10) || 1;
  const pageSizeRaw =
    parseInt(get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) ||
    DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(50, Math.max(5, pageSizeRaw));
  return { pageRaw, pageSize };
}

function buildRecordsUrl(opts: { page: number; pageSize: number }) {
  const usp = new URLSearchParams();
  if (opts.page > 1) usp.set("page", String(opts.page));
  if (opts.pageSize !== DEFAULT_PAGE_SIZE) {
    usp.set("pageSize", String(opts.pageSize));
  }
  const s = usp.toString();
  return s ? `/records?${s}` : "/records";
}

/** Records list with pagination (Phase 3–4). */
export default async function RecordsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { pageRaw, pageSize } = parseSearchParams(sp);
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const isManager = role === "manager";

  const db = getDb();
  const conditions = [isNull(records.deletedAt)];
  if (!isManager) {
    conditions.push(eq(records.createdBy, userId));
  }
  const whereClause = and(...conditions);

  const [countRow] = await db
    .select({ total: count() })
    .from(records)
    .where(whereClause);

  const total = Number(countRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = Math.min(Math.max(1, pageRaw), totalPages);

  const rows = await db
    .select({
      id: records.id,
      recordNo: records.recordNo,
      customerName: records.customerName,
      createdAt: records.createdAt,
      statusName: statuses.name,
    })
    .from(records)
    .innerJoin(statuses, eq(records.statusId, statuses.id))
    .where(whereClause)
    .orderBy(desc(records.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Records</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Intake queue and case work. Create a record for each machine received.
          </p>
        </div>
        <Link
          href="/records/new"
          className={cn(buttonVariants({ variant: "default" }), "gap-2")}
        >
          <Plus className="size-4" aria-hidden />
          New record
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
      >
        <input type="hidden" name="page" value="1" />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Per page</span>
          <select
            name="pageSize"
            defaultValue={String(pageSize)}
            className="flex h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={cn(buttonVariants({ variant: "secondary" }))}>
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Record</TableHead>
              <TableHead className="px-4">Customer</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="hidden px-4 md:table-cell">Created</TableHead>
              <TableHead className="px-4 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No records yet.{" "}
                  <Link href="/records/new" className="text-primary underline">
                    Create one
                  </Link>
                  .
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="px-4 font-mono text-sm font-medium">
                    {r.recordNo}
                  </TableCell>
                  <TableCell className="px-4">{r.customerName}</TableCell>
                  <TableCell className="px-4">{r.statusName}</TableCell>
                  <TableCell className="hidden px-4 text-muted-foreground md:table-cell">
                    {r.createdAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <Link
                      href={`/records/${r.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          total={total}
          page={page}
          pageSize={pageSize}
          buildHref={(p) => buildRecordsUrl({ page: p, pageSize })}
          aria-label="Records pagination"
        />
      </div>
    </div>
  );
}
