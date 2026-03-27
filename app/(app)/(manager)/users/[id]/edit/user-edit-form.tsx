"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction } from "@/services/users";
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

type Props = {
  userId: string;
  initialName: string;
  initialUsername: string;
  initialActive: boolean;
  role: string;
};

/** Client form for updating an existing user. */
export function UserEditForm({
  userId,
  initialName,
  initialUsername,
  initialActive,
  role,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(initialActive);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "");
    const username = String(fd.get("username") ?? "");
    const newPassword = String(fd.get("newPassword") ?? "");
    setPending(true);
    const res = await updateUserAction({
      userId,
      name,
      username,
      isActive: active,
      newPassword: newPassword.length >= 6 ? newPassword : "",
    });
    setPending(false);
    if (!res.ok) {
      setError("error" in res ? res.error : "Something went wrong.");
      return;
    }
    router.push("/users");
    router.refresh();
  }

  const isManager = role === "manager";

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">User</CardTitle>
        <p className="text-sm capitalize text-muted-foreground">
          Role: {role}
          {isManager ? " — manager accounts stay active." : ""}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initialName}
                autoComplete="name"
              />
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
                defaultValue={initialUsername}
                autoComplete="username"
              />
              <FieldDescription>
                4–32 characters: letters, numbers, underscores, dots.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="Leave blank to keep current"
              />
              <FieldDescription>Optional. Min. 6 characters if set.</FieldDescription>
            </Field>
            {!isManager && (
              <Field className="flex flex-row items-center gap-2">
                <input
                  id="active"
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <FieldLabel htmlFor="active" className="font-normal">
                  Account active (can sign in)
                </FieldLabel>
              </Field>
            )}
            {error && (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            )}
            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
