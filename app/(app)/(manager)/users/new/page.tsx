import Link from "next/link";
import { UserCreateForm } from "./user-create-form";

/** Form to create a new specialist (manager-only). */
export default function NewUserPage() {
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
          Add specialist
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates an IT specialist account with email and password.
        </p>
      </div>
      <UserCreateForm />
    </div>
  );
}
