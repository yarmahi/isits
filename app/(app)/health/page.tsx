import { checkDatabase } from "@/lib/health";

/** Simple page that shows app and database connectivity for local debugging. */
export default async function HealthPage() {
  const dbOk = await checkDatabase();
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Health</h1>
      <p className="text-muted-foreground">
        App: <span className="text-foreground">ok</span>
      </p>
      <p className="text-muted-foreground">
        Database:{" "}
        <span className="text-foreground">{dbOk ? "connected" : "not configured / error"}</span>
      </p>
    </div>
  );
}
