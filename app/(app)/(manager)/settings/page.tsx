import Link from "next/link";
import { ListTree, Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** Manager settings hub. */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Branches, statuses, delivery methods, and field rules.
        </p>
      </div>
      <div className="grid gap-4 sm:max-w-2xl">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/80">
              <ListTree className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <CardTitle className="text-base">Record fields</CardTitle>
              <CardDescription>
                Optional system columns, custom fields, and how they behave on
                forms and search.
              </CardDescription>
              <Link
                href="/settings/fields"
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              >
                Manage fields
              </Link>
            </div>
          </CardHeader>
        </Card>
        <Card className="border-border/80 border-dashed bg-muted/20 shadow-none">
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/80">
              <Settings className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-base">Lookups</CardTitle>
              <CardDescription>
                Branches, statuses, and delivery methods can be extended here in
                a later phase.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No additional lookup tools yet.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
