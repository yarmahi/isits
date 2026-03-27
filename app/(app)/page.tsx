import Link from "next/link";

/** Home landing with shortcuts into placeholder routes. */
export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          IT Support Intake &amp; Tracking
        </h1>
        <p className="mt-2 text-muted-foreground">
          Phase 1 shell — navigation and routes are wired; auth and records come
          next.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/records"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Records
        </Link>
        <Link
          href="/health"
          className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Health check
        </Link>
      </div>
    </div>
  );
}
