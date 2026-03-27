import { UserRound } from "lucide-react";
import { requireAuth } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/** Shows the signed-in user’s basic profile from the session. */
export default async function ProfilePage() {
  const session = await requireAuth();
  const u = session.user as {
    name?: string;
    email?: string;
    username?: string;
    role?: string;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account in this workspace.
        </p>
      </div>

      <Card className="max-w-lg border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
            <UserRound className="size-6 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-lg">{u.name ?? "—"}</CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">
              {u.username ?? "—"}
            </CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{u.role ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="max-w-[14rem] truncate font-mono text-xs">
              {u.email ?? "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
