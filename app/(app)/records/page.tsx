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
import { RecordRowActions } from "@/components/records/record-row-actions";
import { RecordStatusBadge } from "@/components/records/record-status-badge";
import { formatRecordDate } from "@/lib/format";

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
      pcModel: records.pcModel,
      serialNumber: records.serialNumber,
      customerName: records.customerName,
      phoneNumber: records.phoneNumber,
      dateReceived: records.dateReceived,
      dateReturned: records.dateReturned,
      deletedAt: records.deletedAt,
      createdBy: records.createdBy,
      statusName: statuses.name,
      statusCode: statuses.code,
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
            <div className="hidden overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="whitespace-nowrap px-3">Record</TableHead>
                    <TableHead className="min-w-[7rem] px-3">PC</TableHead>
                    <TableHead className="min-w-[7rem] px-3">Serial</TableHead>
                    <TableHead className="min-w-[7rem] px-3">Name</TableHead>
                    <TableHead className="whitespace-nowrap px-3">Phone</TableHead>
                    <TableHead className="whitespace-nowrap px-3">
                      Received
                    </TableHead>
                    <TableHead className="whitespace-nowrap px-3">
                      Returned
                    </TableHead>
                    <TableHead className="whitespace-nowrap px-3">Status</TableHead>
                    <TableHead className="px-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap px-3 font-mono text-sm font-medium">
                        {r.recordNo}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate px-3 text-sm">
                        {r.pcModel}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate px-3 font-mono text-xs">
                        {r.serialNumber}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate px-3 text-sm">
                        {r.customerName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 text-sm">
                        {r.phoneNumber}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 text-sm text-muted-foreground">
                        {formatRecordDate(r.dateReceived)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 text-sm text-muted-foreground">
                        {formatRecordDate(r.dateReturned)}
                      </TableCell>
                      <TableCell className="px-3">
                        <RecordStatusBadge
                          name={r.statusName}
                          code={r.statusCode}
                        />
                      </TableCell>
                      <TableCell className="px-3 text-right">
                        <RecordRowActions
                          recordId={r.id}
                          canEdit={
                            !r.deletedAt &&
                            (isManager || r.createdBy === userId)
                          }
                          canArchive={isManager && !r.deletedAt}
                        />
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
                    <RecordRowActions
                      recordId={r.id}
                      canEdit={
                        !r.deletedAt &&
                        (isManager || r.createdBy === userId)
                      }
                      canArchive={isManager && !r.deletedAt}
                    />
                  </div>
                  <dl className="mt-3 grid gap-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">PC</dt>
                      <dd className="max-w-[60%] truncate text-right">{r.pcModel}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Serial</dt>
                      <dd className="max-w-[60%] truncate text-right font-mono text-xs">
                        {r.serialNumber}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="max-w-[60%] truncate text-right">
                        {r.customerName}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="text-right">{r.phoneNumber}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Received</dt>
                      <dd className="text-right text-muted-foreground">
                        {formatRecordDate(r.dateReceived)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Returned</dt>
                      <dd className="text-right text-muted-foreground">
                        {formatRecordDate(r.dateReturned)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>
                        <RecordStatusBadge
                          name={r.statusName}
                          code={r.statusCode}
                        />
                      </dd>
                    </div>
                  </dl>
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
