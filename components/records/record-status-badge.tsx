import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const codeStyles: Record<string, string> = {
  received:
    "border-sky-500/30 bg-sky-500/10 font-medium text-sky-900 dark:text-sky-100",
  in_progress:
    "border-amber-500/30 bg-amber-500/10 font-medium text-amber-900 dark:text-amber-100",
  waiting:
    "border-orange-500/30 bg-orange-500/10 font-medium text-orange-900 dark:text-orange-100",
  ready_for_return:
    "border-violet-500/30 bg-violet-500/10 font-medium text-violet-900 dark:text-violet-100",
  returned:
    "border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-900 dark:text-emerald-100",
  cancelled:
    "border-muted-foreground/30 bg-muted font-medium text-muted-foreground",
};

/** Status pill using lookup `code` for color; falls back to neutral. */
export function RecordStatusBadge({
  name,
  code,
}: {
  name: string;
  code: string;
}) {
  const style = codeStyles[code] ?? "border-border bg-muted/80 font-medium";
  return (
    <Badge
      variant="outline"
      className={cn("max-w-[10rem] truncate border", style)}
      title={name}
    >
      {name}
    </Badge>
  );
}
