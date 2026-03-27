import { ClipboardList } from "lucide-react";
import { requireAuth } from "@/lib/permissions";
import { TablePagination } from "@/components/table-pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const RECORDS_PAGE_SIZE = 10;

/** Placeholder for the records list (Phase 4). Includes empty table + pagination pattern. */
export default async function RecordsPage() {
  await requireAuth();
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Records</h1>
        <p className="text-sm text-muted-foreground">
          Intake queue and case work will live here.
        </p>
      </div>
      <Card className="max-w-2xl border-border/80 border-dashed bg-muted/20 shadow-none">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/80">
            <ClipboardList className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">Coming in Phase 3–4</CardTitle>
            <CardDescription>
              You will create and edit records from this area. The main add/edit
              experience will use full pages for focus.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>No records yet — schema and workflows are wired up next.</p>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Reference</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="hidden px-4 md:table-cell">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={3}
                className="h-24 text-center text-muted-foreground"
              >
                No rows yet.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <TablePagination
          total={0}
          page={1}
          pageSize={RECORDS_PAGE_SIZE}
          buildHref={() => "/records"}
          aria-label="Records pagination"
        />
      </div>
    </div>
  );
}
