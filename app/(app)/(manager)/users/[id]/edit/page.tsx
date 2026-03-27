import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { user } from "@/db/schema";
import { UserEditForm } from "./user-edit-form";

type Props = { params: Promise<{ id: string }> };

/** Edit user details and activation (manager-only). */
export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const db = getDb();
  const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  if (!row) {
    notFound();
  }
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/users"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to users
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Edit user
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update profile, status, or set a new password.
        </p>
      </div>
      <UserEditForm
        userId={row.id}
        initialName={row.name}
        initialUsername={row.username ?? row.email.split("@")[0] ?? ""}
        initialActive={row.isActive}
        role={row.role}
      />
    </div>
  );
}
