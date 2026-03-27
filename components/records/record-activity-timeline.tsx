import {
  getRecordActivityEntries,
  formatRecordEventLabel,
} from "@/lib/record-activity";
import { cn } from "@/lib/utils";

function formatWhen(d: Date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

/** Google Docs–style compact revision list for one record (server component). */
export async function RecordActivityTimeline({
  recordId,
}: {
  recordId: string;
}) {
  const entries = await getRecordActivityEntries(recordId);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight">Activity</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          No logged events for this record yet. Only actions that write to the
          audit log appear here—some activity may not be captured.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight">Activity</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Newest first · {entries.length} event
        {entries.length === 1 ? "" : "s"}
      </p>
      <ul className="mt-4 space-y-0" aria-label="Record activity">
        {entries.map((e, i) => (
          <li key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <span
                className="size-2 shrink-0 rounded-full bg-primary ring-4 ring-card"
                aria-hidden
              />
              {i < entries.length - 1 ? (
                <span className="mt-1 min-h-[2.75rem] w-px flex-1 bg-border" />
              ) : null}
            </div>
            <div className={cn("min-w-0 flex-1 pb-5", i === entries.length - 1 && "pb-0")}>
              <p className="text-sm font-medium leading-snug text-foreground">
                {formatRecordEventLabel(e.eventType)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatWhen(e.createdAt)}
                {e.actorDisplayName != null && e.actorDisplayName !== "" ? (
                  <>
                    {" · "}
                    <span className="text-foreground/90">{e.actorDisplayName}</span>
                  </>
                ) : (
                  " · Unknown user"
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Placeholder while the timeline query resolves. */
export function RecordActivityTimelineSkeleton() {
  return (
    <div
      className="rounded-xl border border-border/80 bg-card p-4 shadow-sm"
      aria-busy
      aria-label="Loading activity"
    >
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted/80" />
      <div className="mt-4 space-y-0">
        {[1, 2, 3].map((k) => (
          <div key={k} className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-muted" />
              {k < 3 ? (
                <span className="mt-1 min-h-[2.75rem] w-px flex-1 bg-muted/50" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-2 pb-5 last:pb-0">
              <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
