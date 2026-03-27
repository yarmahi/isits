import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

/** Public login page; signed-in users are sent to the records workspace. */
export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/records");
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-background px-4 py-12">
      <LoginForm />
    </div>
  );
}
