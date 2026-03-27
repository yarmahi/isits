"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction } from "@/services/users";
import { toastSuccess } from "@/lib/sweet-alert";
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
  userId: string;
  initialName: string;
  initialUsername: string;
  initialActive: boolean;
  role: string;
  onFinished?: () => void;
  onCancel?: () => void;
};

/** Form body for updating a user (used inside a dialog or standalone). */
export function UserEditForm({
  userId,
  initialName,
  initialUsername,
  initialActive,
  role,
  onFinished,
  onCancel,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(initialActive);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
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
      setFormError(
        "error" in res && typeof res.error === "string"
          ? res.error
          : "Could not save changes.",
      );
      return;
    }
    await toastSuccess("User saved");
    router.refresh();
    onFinished?.();
  }

  const isManager = role === "manager";

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {formError}
        </div>
      )}
      <FieldGroup>
        {isManager && (
          <FieldDescription>
            Manager accounts remain active; username and name can be updated.
          </FieldDescription>
        )}
        <Field>
          <FieldLabel htmlFor="edit-name">Full name</FieldLabel>
          <Input
            id="edit-name"
            name="name"
            required
            defaultValue={initialName}
            autoComplete="name"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-username">Username</FieldLabel>
          <Input
            id="edit-username"
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
          <FieldLabel htmlFor="edit-newPassword">New password</FieldLabel>
          <Input
            id="edit-newPassword"
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
              id="edit-active"
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <FieldLabel htmlFor="edit-active" className="font-normal">
              Account active (can sign in)
            </FieldLabel>
          </Field>
        )}
      </FieldGroup>
      <DialogFooter className="gap-2 sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
