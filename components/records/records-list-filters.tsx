"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { RecordsListParsed } from "@/lib/records-list";
import { hasAdvancedRecordFilters } from "@/lib/records-list";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";
const selectClass =
  "flex h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

type LookupRow = { id: string; name: string };

type Props = {
  parsed: RecordsListParsed;
  lookups: {
    branches: LookupRow[];
    statuses: LookupRow[];
    deliveryMethods: LookupRow[];
  };
  isManager: boolean;
  usersForFilter: LookupRow[];
};

/** Search + per page always visible; other filters in collapsible “Advanced”. */
export function RecordsListFilters({
  parsed,
  lookups,
  isManager,
  usersForFilter,
}: Props) {
  const advancedApplied = hasAdvancedRecordFilters(parsed);
  const [advancedOpen, setAdvancedOpen] = useState(advancedApplied);

  useEffect(() => {
    setAdvancedOpen(advancedApplied);
  }, [advancedApplied]);

  return (
    <form
      method="get"
      action="/records"
      className="space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
    >
      <input type="hidden" name="page" value="1" />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm sm:min-w-[12rem]">
          <span className="text-muted-foreground">Search</span>
          <input
            name="q"
            type="search"
            placeholder="Record, customer, serial…"
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
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "w-full sm:w-auto",
            )}
          >
            Apply
          </button>
          <Link
            href="/records"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-center sm:w-auto",
            )}
          >
            Clear all
          </Link>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-1.5",
            )}
            aria-expanded={advancedOpen}
            aria-controls="records-list-advanced-filters"
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
        id="records-list-advanced-filters"
        hidden={!advancedOpen}
        className="grid gap-3 border-t border-border/80 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Branch</span>
          <select
            name="branchId"
            defaultValue={parsed.branchId}
            className={selectClass}
          >
            <option value="">All</option>
            {lookups.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            name="statusId"
            defaultValue={parsed.statusId}
            className={selectClass}
          >
            <option value="">All</option>
            {lookups.statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <select
            name="deliveryMethodId"
            defaultValue={parsed.deliveryMethodId}
            className={selectClass}
          >
            <option value="">All</option>
            {lookups.deliveryMethods.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Date received from</span>
          <input
            name="dateReceivedFrom"
            type="date"
            defaultValue={parsed.dateReceivedFrom}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Date received to</span>
          <input
            name="dateReceivedTo"
            type="date"
            defaultValue={parsed.dateReceivedTo}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Date returned from</span>
          <input
            name="dateReturnedFrom"
            type="date"
            defaultValue={parsed.dateReturnedFrom}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Date returned to</span>
          <input
            name="dateReturnedTo"
            type="date"
            defaultValue={parsed.dateReturnedTo}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Scope</span>
          <select
            name="scope"
            defaultValue={parsed.scope}
            className={selectClass}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Sort</span>
          <select name="sort" defaultValue={parsed.sort} className={selectClass}>
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="record_no_asc">Record # A–Z</option>
            <option value="record_no_desc">Record # Z–A</option>
            <option value="customer_asc">Customer A–Z</option>
          </select>
        </label>
        {isManager && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Created by</span>
              <select
                name="createdBy"
                defaultValue={parsed.createdBy}
                disabled={parsed.mine}
                className={cn(selectClass, "disabled:opacity-50")}
              >
                <option value="">All</option>
                {usersForFilter.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Updated by</span>
              <select
                name="updatedBy"
                defaultValue={parsed.updatedBy}
                className={selectClass}
              >
                <option value="">All</option>
                {usersForFilter.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 pb-1 text-sm">
              <input
                name="mine"
                type="checkbox"
                value="1"
                defaultChecked={parsed.mine}
                className="size-4 rounded border-input"
              />
              <span className="text-muted-foreground">Only my records</span>
            </label>
          </>
        )}
      </div>

    </form>
  );
}
