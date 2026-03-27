import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireAuth } from "@/lib/permissions";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { QuickLinksCard } from "@/components/home/quick-links-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Home: analytics + floating quick links (Phase 3). */
export default async function HomePage() {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  const isManager = role === "manager";
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div className="lg:grid lg:grid-cols-[1fr_min(20rem,100%)] lg:items-start lg:gap-10">
        <div className="space-y-8">
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-8 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              IT Support Intake &amp; Tracking
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
              Overview of intake volume and workload. Open Records to create or
              update cases.
              {isManager
                ? " As a manager, you have full visibility across users and records."
                : ""}
            </p>
            <div className="mt-6">
              <Link
                href="/records/new"
                className={cn(buttonVariants({ variant: "default" }), "gap-2")}
              >
                <ClipboardList className="size-4" aria-hidden />
                New record
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Active users
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {stats.activeUsers}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Can sign in
              </p>
            </div>
          </div>

          <DashboardCharts stats={stats} />
        </div>

        <QuickLinksCard isManager={isManager} />
      </div>
    </div>
  );
}
