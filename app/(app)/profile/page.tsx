import { requireAuth } from "@/lib/permissions";

/** Shows the signed-in user’s basic profile from the session. */
export default async function ProfilePage() {
  const session = await requireAuth();
  const u = session.user as {
    name?: string;
    email?: string;
    username?: string;
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account in this workspace.
        </p>
      </div>
      <dl className="max-w-md space-y-3 rounded-xl border border-border/80 bg-card p-6 text-sm shadow-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Name</dt>
          <dd className="mt-0.5">{u.name}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Username</dt>
          <dd className="mt-0.5 font-mono">{u.username ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Role</dt>
          <dd className="mt-0.5 capitalize">
            {(u as { role?: string }).role ?? "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
