"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSpecialistAction } from "@/services/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

/** Client form that posts a new specialist to the server action. */
export function UserCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "");
    const username = String(fd.get("username") ?? "");
    const password = String(fd.get("password") ?? "");
    setPending(true);
    const res = await createSpecialistAction({ name, username, password });
    setPending(false);
    if (!res.ok) {
      setError("error" in res ? res.error : "Something went wrong.");
      return;
    }
    router.push("/users");
    router.refresh();
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Account details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input id="name" name="name" required autoComplete="name" />
            </Field>
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                name="username"
                type="text"
                required
                minLength={4}
                maxLength={32}
                autoComplete="username"
              />
              <FieldDescription>
                4–32 characters: letters, numbers, underscores, dots.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Temporary password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <FieldDescription>At least 6 characters.</FieldDescription>
            </Field>
            {error && (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            )}
            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create specialist"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
