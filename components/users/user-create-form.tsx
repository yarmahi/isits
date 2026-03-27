"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSpecialistAction } from "@/services/users";
import { toastError, toastSuccess } from "@/lib/sweet-alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";

type Props = {
  onFinished?: () => void;
  onCancel?: () => void;
};

/** Form body for creating a specialist (used inside a dialog or standalone). */
export function UserCreateForm({ onFinished, onCancel }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "");
    const username = String(fd.get("username") ?? "");
    const password = String(fd.get("password") ?? "");
    setPending(true);
    const res = await createSpecialistAction({ name, username, password });
    setPending(false);
    if (!res.ok) {
      await toastError(
        "Could not create user",
        "error" in res ? res.error : "Something went wrong.",
      );
      return;
    }
    await toastSuccess("Specialist created");
    router.refresh();
    onFinished?.();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="create-name">Full name</FieldLabel>
          <Input id="create-name" name="name" required autoComplete="name" />
        </Field>
        <Field>
          <FieldLabel htmlFor="create-username">Username</FieldLabel>
          <Input
            id="create-username"
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
          <FieldLabel htmlFor="create-password">Temporary password</FieldLabel>
          <Input
            id="create-password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <FieldDescription>At least 6 characters.</FieldDescription>
        </Field>
      </FieldGroup>
      <DialogFooter className="gap-2 sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create specialist"}
        </Button>
      </DialogFooter>
    </form>
  );
}
