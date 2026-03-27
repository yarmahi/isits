import { Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Placeholder for lookups and field configuration (later phases). */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Branches, statuses, delivery methods, and field rules.
        </p>
      </div>
      <Card className="max-w-2xl border-border/80 border-dashed bg-muted/20 shadow-none">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/80">
            <Settings className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">Configuration</CardTitle>
            <CardDescription>
              Lookups and validation rules will be managed here in a later
              phase.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nothing to configure yet.
        </CardContent>
      </Card>
    </div>
  );
}
