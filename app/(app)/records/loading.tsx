/** Loading UI for the records list (server-side data). */
export default function RecordsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-48 w-full animate-pulse rounded-xl bg-muted" />
      <div className="space-y-2">
        <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
