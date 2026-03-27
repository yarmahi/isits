import { requireAuth } from "@/lib/permissions";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { cn } from "@/lib/utils";

/** Home: scoped analytics (specialist = own records; manager = org-wide). */
export default async function HomePage() {
  const session = await requireAuth();
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const isManager = role === "manager";
  const stats = await getDashboardStats({ userId, isManager });

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "grid gap-4",
          stats.activeUsers !== undefined
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "sm:grid-cols-2",
        )}
      >
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            This week
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {stats.thisWeekRecords}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">New records</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Last week
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {stats.lastWeekRecords}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">New records</p>
        </div>
        {stats.activeUsers !== undefined && (
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active users
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {stats.activeUsers}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Can sign in</p>
          </div>
        )}
      </div>

      <DashboardCharts stats={stats} />
    </div>
  );
}
