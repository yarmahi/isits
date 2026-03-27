import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Placeholder for the manager activity log (Phase 5). */
export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Audit trail and filters for managers.
        </p>
      </div>
      <Card className="max-w-2xl border-border/80 border-dashed bg-muted/20 shadow-none">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/80">
            <Activity className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">Planned for Phase 5</CardTitle>
            <CardDescription>
              You will filter by user, action, and date range here.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No events recorded yet.
        </CardContent>
      </Card>
    </div>
  );
}
