import Link from "next/link";

type Props = {
  total: number;
  page: number;
  pageSize: number;
  buildHref: (nextPage: number) => string;
  "aria-label"?: string;
};

/** Footer row for data tables: range summary + prev/next. Use on every paginated table. */
export function TablePagination({
  total,
  page,
  pageSize,
  buildHref,
  "aria-label": ariaLabel = "Pagination",
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div
      className="flex flex-col gap-3 border-t border-border/80 bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
      role="navigation"
      aria-label={ariaLabel}
    >
      <p>
        Showing{" "}
        <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <PaginationLink
          href={buildHref(safePage - 1)}
          disabled={safePage <= 1}
        >
          Previous
        </PaginationLink>
        <span className="tabular-nums text-foreground">
          Page {safePage} of {totalPages}
        </span>
        <PaginationLink
          href={buildHref(safePage + 1)}
          disabled={safePage >= totalPages || total === 0}
        >
          Next
        </PaginationLink>
      </div>
    </div>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-md px-2 py-1 opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="cursor-pointer rounded-md px-2 py-1 font-medium text-primary hover:underline"
    >
      {children}
    </Link>
  );
}
