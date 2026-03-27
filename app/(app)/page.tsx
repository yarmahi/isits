import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { requireAuth } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Home landing after login with shortcuts into the workspace. */
export default async function HomePage() {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  const isManager = role === "manager";

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          IT Support Intake &amp; Tracking
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
          Use Records for daily intake work. Keep your profile up to date.
          {isManager
            ? " As a manager, you can manage users, review activity, and open settings."
            : ""}
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Quick access
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Records</CardTitle>
                <CardDescription>
                  Intake queue and case work (coming in a later phase).
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="border-t border-border/60 bg-muted/20 pt-4">
              <Link
                href="/records"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "w-full gap-2",
                )}
              >
                Open records
                <ArrowRight className="size-4 opacity-70" aria-hidden />
              </Link>
            </CardFooter>
          </Card>

          <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                <UserRound className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Profile</CardTitle>
                <CardDescription>
                  Your name, username, and role in this workspace.
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="border-t border-border/60 bg-muted/20 pt-4">
              <Link
                href="/profile"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full gap-2",
                )}
              >
                View profile
                <ArrowRight className="size-4 opacity-70" aria-hidden />
              </Link>
            </CardFooter>
          </Card>

          {isManager && (
            <>
              <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="size-5" aria-hidden />
                  </div>
                  <div>
                    <CardTitle className="text-base">Users</CardTitle>
                    <CardDescription>
                      Create specialists and manage accounts.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardFooter className="border-t border-border/60 bg-muted/20 pt-4">
                  <Link
                    href="/users"
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "w-full gap-2",
                    )}
                  >
                    Manage users
                    <ArrowRight className="size-4 opacity-70" aria-hidden />
                  </Link>
                </CardFooter>
              </Card>

              <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Activity className="size-5" aria-hidden />
                  </div>
                  <div>
                    <CardTitle className="text-base">Activity</CardTitle>
                    <CardDescription>
                      Audit trail and filters (planned).
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardFooter className="border-t border-border/60 bg-muted/20 pt-4">
                  <Link
                    href="/activity"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full gap-2",
                    )}
                  >
                    View activity
                    <ArrowRight className="size-4 opacity-70" aria-hidden />
                  </Link>
                </CardFooter>
              </Card>

              <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Settings className="size-5" aria-hidden />
                  </div>
                  <div>
                    <CardTitle className="text-base">Settings</CardTitle>
                    <CardDescription>
                      Lookups and field rules (planned).
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardFooter className="border-t border-border/60 bg-muted/20 pt-4">
                  <Link
                    href="/settings"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full gap-2",
                    )}
                  >
                    Open settings
                    <ArrowRight className="size-4 opacity-70" aria-hidden />
                  </Link>
                </CardFooter>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
