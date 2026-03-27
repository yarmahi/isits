import Link from "next/link";
import { Suspense } from "react";
import { asc, count, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { getDb } from "@/db";
import { records, statuses, user } from "@/db/schema";
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
import { fetchRecordLookups } from "@/services/records";
import {
  buildRecordsListUrl,
  buildRecordsListWhere,
  parseRecordsListParams,
  recordsListOrderBy,
} from "@/lib/records-list";
import { RecordsCreatedToast } from "@/components/records/records-created-toast";
import { RecordsListFilters } from "@/components/records/records-list-filters";

/** Records list: search, filters, sort, URL state, pagination, mobile cards (Phase 4). */
export default async function RecordsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsed = parseRecordsListParams(sp);
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const isManager = role === "manager";

  const db = getDb();
  const whereClause = buildRecordsListWhere(parsed, { userId, isManager });

  const [countRow] = await db
    .select({ total: count() })
    .from(records)
    .where(whereClause);

  const total = Number(countRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / parsed.pageSize) || 1);
  const page = Math.min(Math.max(1, parsed.page), totalPages);
  const listState = { ...parsed, page };

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
    .orderBy(...recordsListOrderBy(parsed.sort))
    .limit(parsed.pageSize)
    .offset((page - 1) * parsed.pageSize);

  const lookups = await fetchRecordLookups();
  const usersForFilter = isManager
    ? await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(eq(user.isActive, true))
        .orderBy(asc(user.name))
    : [];

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <RecordsCreatedToast />
      </Suspense>

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

      <RecordsListFilters
        key={buildRecordsListUrl(listState, {})}
        parsed={parsed}
        lookups={{
          branches: lookups.branches.map((b) => ({ id: b.id, name: b.name })),
          statuses: lookups.statuses.map((s) => ({ id: s.id, name: s.name })),
          deliveryMethods: lookups.deliveryMethods.map((d) => ({
            id: d.id,
            name: d.name,
          })),
        }}
        isManager={isManager}
        usersForFilter={usersForFilter}
      />

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card p-8 text-center text-muted-foreground shadow-sm">
            No records match.{" "}
            <Link href="/records/new" className="text-primary underline">
              Create one
            </Link>
            {" or "}
            <Link href="/records" className="text-primary underline">
              clear filters
            </Link>
            .
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4">Record</TableHead>
                    <TableHead className="px-4">Customer</TableHead>
                    <TableHead className="px-4">Status</TableHead>
                    <TableHead className="px-4">Created</TableHead>
                    <TableHead className="px-4 text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-4 font-mono text-sm font-medium">
                        {r.recordNo}
                      </TableCell>
                      <TableCell className="px-4">{r.customerName}</TableCell>
                      <TableCell className="px-4">{r.statusName}</TableCell>
                      <TableCell className="px-4 text-muted-foreground">
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
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                total={total}
                page={page}
                pageSize={parsed.pageSize}
                buildHref={(p) => buildRecordsListUrl(listState, { page: p })}
                aria-label="Records pagination"
              />
            </div>

            <div className="space-y-3 md:hidden">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-border/80 bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-sm font-medium">{r.recordNo}</p>
                    <Link
                      href={`/records/${r.id}`}
                      className="shrink-0 text-sm font-medium text-primary hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                  <p className="mt-1 text-sm">{r.customerName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.statusName}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {r.createdAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              ))}
              <TablePagination
                total={total}
                page={page}
                pageSize={parsed.pageSize}
                buildHref={(p) => buildRecordsListUrl(listState, { page: p })}
                aria-label="Records pagination"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
