"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { ActivityListParsed } from "@/lib/activity-list";
import {
  ACTIVITY_ENTITY_TYPES,
  ACTIVITY_EVENT_TYPES,
  hasAdvancedActivityFilters,
} from "@/lib/activity-list";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";
const selectClass =
  "flex h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

type ActorOption = { id: string; name: string };

type Props = {
  parsed: ActivityListParsed;
  actorOptions: ActorOption[];
};

/** Search + per page; other filters in collapsible “Advanced” (same idea as Records). */
export function ActivityListFilters({ parsed, actorOptions }: Props) {
  const advancedApplied = hasAdvancedActivityFilters(parsed);
  const [advancedOpen, setAdvancedOpen] = useState(advancedApplied);

  useEffect(() => {
    setAdvancedOpen(advancedApplied);
  }, [advancedApplied]);

  return (
    <form
      method="get"
      action="/activity"
      className="space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
    >
      <input type="hidden" name="page" value="1" />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm sm:min-w-[12rem]">
          <span className="text-muted-foreground">Search</span>
          <input
            name="q"
            type="search"
            placeholder="Event, entity, route, IP…"
            defaultValue={parsed.q}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:w-36">
          <span className="text-muted-foreground">Per page</span>
          <select
            name="pageSize"
            defaultValue={String(parsed.pageSize)}
            className={selectClass}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "secondary" }))}
          >
            Apply
          </button>
          <Link
            href="/activity"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Clear all
          </Link>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((o) => !o)}
          >
            Advanced filters
            {advancedApplied && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                Active
              </span>
            )}
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform",
                advancedOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-3 border-t border-border/80 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          !advancedOpen && "hidden",
        )}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Event</span>
          <select
            name="eventType"
            defaultValue={parsed.eventType}
            className={selectClass}
          >
            {ACTIVITY_EVENT_TYPES.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Entity type</span>
          <select
            name="entityType"
            defaultValue={parsed.entityType}
            className={selectClass}
          >
            {ACTIVITY_ENTITY_TYPES.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Actor</span>
          <select
            name="actorId"
            defaultValue={parsed.actorId}
            className={selectClass}
          >
            <option value="">All</option>
            {actorOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Entity id</span>
          <input
            name="entityId"
            defaultValue={parsed.entityId}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">IP contains</span>
          <input
            name="ip"
            defaultValue={parsed.ip}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">From date</span>
          <input
            name="dateFrom"
            type="date"
            defaultValue={parsed.dateFrom}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">To date</span>
          <input
            name="dateTo"
            type="date"
            defaultValue={parsed.dateTo}
            className={inputClass}
          />
        </label>
      </div>
    </form>
  );
}
