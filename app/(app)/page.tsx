import Link from "next/link";
import { requireAuth } from "@/lib/permissions";

/** Home landing after login with shortcuts into the workspace. */
export default async function HomePage() {
  await requireAuth();
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/30 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          IT Support Intake &amp; Tracking
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Use Records for daily intake work. Managers can open Users, Activity,
          and Settings from the top bar.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/records"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open records
          </Link>
          <Link
            href="/profile"
            className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
