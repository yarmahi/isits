"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Username/password sign-in via Better Auth. */
export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await authClient.signIn.username({
      username: username.trim(),
      password,
    });
    setPending(false);
    if (res.error) {
      setError(res.error.message ?? "Could not sign in.");
      return;
    }
    window.location.assign("/records");
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <AppLogo size="md" />
        </div>
        <div>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            IT Support Intake &amp; Tracking — internal use only
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                minLength={4}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <FieldDescription>At least 4 characters.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldDescription>At least 6 characters.</FieldDescription>
            </Field>
            {error && (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            )}
            <Field>
              <Button type="submit" className="w-full gap-2" disabled={pending}>
                <LogIn className="size-4 opacity-80" aria-hidden />
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
