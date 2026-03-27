import Link from "next/link";
import { Activity as ActivityIcon } from "lucide-react";
import { asc, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activityLogs, user } from "@/db/schema";
import { requireManager } from "@/lib/permissions";
import { TablePagination } from "@/components/table-pagination";
import { ActivityListFilters } from "@/components/activity/activity-list-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildActivityListUrl,
  buildActivityWhere,
  parseActivityListParams,
  type ActivityListParsed,
} from "@/lib/activity-list";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Manager audit trail with filters (Phase 5). */
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireManager();
  const sp = await searchParams;
  const parsed = parseActivityListParams(sp);
  const db = getDb();
  const whereClause = buildActivityWhere(parsed);

  const [countRow] = await db
    .select({ total: count() })
    .from(activityLogs)
    .where(whereClause);

  const total = Number(countRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / parsed.pageSize) || 1);
  const page = Math.min(Math.max(1, parsed.page), totalPages);
  const listState: ActivityListParsed = { ...parsed, page };

  const rows = await db
    .select({
      id: activityLogs.id,
      createdAt: activityLogs.createdAt,
      eventType: activityLogs.eventType,
      actorUserId: activityLogs.actorUserId,
      actorRole: activityLogs.actorRole,
      actorName: user.name,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      route: activityLogs.route,
      url: activityLogs.url,
      ipAddress: activityLogs.ipAddress,
      browserName: activityLogs.browserName,
      deviceType: activityLogs.deviceType,
    })
    .from(activityLogs)
    .leftJoin(user, eq(activityLogs.actorUserId, user.id))
    .where(whereClause)
    .orderBy(desc(activityLogs.createdAt))
    .limit(parsed.pageSize)
    .offset((page - 1) * parsed.pageSize);

  const actorOptions = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .orderBy(asc(user.name));

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Audit trail: sign-ins, record and user changes, and page views. Secrets
          are never stored in snapshots.
        </p>
      </div>

      <ActivityListFilters
        key={buildActivityListUrl(listState, {})}
        parsed={parsed}
        actorOptions={actorOptions.map((u) => ({ id: u.id, name: u.name }))}
      />

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="whitespace-nowrap px-3">Time</TableHead>
              <TableHead className="whitespace-nowrap px-3">Event</TableHead>
              <TableHead className="whitespace-nowrap px-3">Actor</TableHead>
              <TableHead className="whitespace-nowrap px-3">Entity</TableHead>
              <TableHead className="whitespace-nowrap px-3">Route / URL</TableHead>
              <TableHead className="whitespace-nowrap px-3">IP</TableHead>
              <TableHead className="whitespace-nowrap px-3">Device</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-0">
                  <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/80">
                      <ActivityIcon
                        className="size-7 text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                    <div className="max-w-sm space-y-2">
                      <p className="font-medium text-foreground">
                        No activity matches
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Broaden the date range or clear search to see more log
                        entries.
                      </p>
                    </div>
                    <Link
                      href="/activity"
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      Clear filters
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap px-3 text-xs text-muted-foreground">
                    {r.createdAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="max-w-[8rem] truncate px-3 font-mono text-xs">
                    {r.eventType}
                  </TableCell>
                  <TableCell className="max-w-[10rem] px-3 text-sm">
                    <span className="font-medium">
                      {r.actorName ?? "—"}
                    </span>
                    {r.actorRole && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({r.actorRole})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[12rem] px-3 text-xs">
                    {r.entityType ?? "—"}
                    {r.entityId && (
                      <span className="ml-1 font-mono text-muted-foreground">
                        {r.entityId.length > 12
                          ? `${r.entityId.slice(0, 12)}…`
                          : r.entityId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[14rem] truncate px-3 text-xs font-mono text-muted-foreground">
                    {r.route ?? r.url ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 font-mono text-xs">
                    {r.ipAddress ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[8rem] px-3 text-xs text-muted-foreground">
                    {[r.browserName, r.deviceType].filter(Boolean).join(" · ") ||
                      "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          total={total}
          page={page}
          pageSize={parsed.pageSize}
          buildHref={(p) => buildActivityListUrl(listState, { page: p })}
          aria-label="Activity log pagination"
        />
      </div>
    </div>
  );
}
