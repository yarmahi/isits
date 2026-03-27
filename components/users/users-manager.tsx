"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  Power,
  PowerOff,
  UserPlus,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { setUserActiveAction } from "@/services/users";
import { toastError, toastSuccess } from "@/lib/sweet-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserCreateForm } from "@/components/users/user-create-form";
import { UserEditForm } from "@/components/users/user-edit-form";

export type UserRow = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export const USERS_DEFAULT_PAGE_SIZE = 10;

function buildUsersListUrl(opts: {
  page: number;
  pageSize: number;
  q: string;
  roleFilter: string;
  statusFilter: string;
}) {
  const usp = new URLSearchParams();
  if (opts.page > 1) usp.set("page", String(opts.page));
  if (opts.pageSize !== USERS_DEFAULT_PAGE_SIZE) {
    usp.set("pageSize", String(opts.pageSize));
  }
  if (opts.q) usp.set("q", opts.q);
  if (opts.roleFilter !== "all") usp.set("role", opts.roleFilter);
  if (opts.statusFilter !== "all") usp.set("status", opts.statusFilter);
  const s = usp.toString();
  return s ? `/users?${s}` : "/users";
}

function formatAdded(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Props = {
  users: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  roleFilter: "all" | "manager" | "specialist";
  statusFilter: "all" | "active" | "inactive";
};

/** Manager table: filters, pagination, view/edit modals, activate/deactivate. */
export function UsersManager({
  users,
  total,
  page,
  pageSize,
  q,
  roleFilter,
  statusFilter,
}: Props) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const myId = session?.user?.id;

  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<UserRow | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{
    user: UserRow;
    nextActive: boolean;
  } | null>(null);
  const [statusPending, setStatusPending] = useState(false);

  const buildHref = useMemo(
    () => (nextPage: number) =>
      buildUsersListUrl({
        page: nextPage,
        pageSize,
        q,
        roleFilter,
        statusFilter,
      }),
    [pageSize, q, roleFilter, statusFilter],
  );

  function canDeactivate(u: UserRow) {
    if (u.id === myId) return false;
    if (u.role === "manager") return false;
    return u.isActive;
  }

  function canActivate(u: UserRow) {
    return !u.isActive && u.role !== "manager";
  }

  async function onConfirmStatus() {
    if (!statusConfirm) return;
    const { user, nextActive } = statusConfirm;
    setStatusPending(true);
    const res = await setUserActiveAction({
      userId: user.id,
      isActive: nextActive,
    });
    setStatusPending(false);
    if (res.ok) {
      void toastSuccess(
        nextActive ? "Account activated" : "Account deactivated",
      );
      setStatusConfirm(null);
      router.refresh();
    } else {
      void toastError(
        "Could not update",
        "error" in res ? res.error : "Could not update status.",
      );
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Manage IT specialist accounts. New accounts are created here — there
            is no public registration.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <UserPlus className="size-4" aria-hidden />
          Add specialist
        </Button>
      </div>

      <form
        method="get"
        className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm md:flex-row md:flex-wrap md:items-end"
      >
        <input type="hidden" name="page" value="1" />
        <Field className="min-w-[12rem] flex-1">
          <FieldLabel htmlFor="users-q">Search</FieldLabel>
          <Input
            id="users-q"
            name="q"
            placeholder="Name, username, or email"
            defaultValue={q}
            className="max-w-md"
          />
        </Field>
        <Field className="w-full min-w-[8rem] md:w-40">
          <FieldLabel htmlFor="users-role">Role</FieldLabel>
          <select
            id="users-role"
            name="role"
            defaultValue={roleFilter}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
          >
            <option value="all">All roles</option>
            <option value="manager">Manager</option>
            <option value="specialist">Specialist</option>
          </select>
        </Field>
        <Field className="w-full min-w-[8rem] md:w-40">
          <FieldLabel htmlFor="users-status">Status</FieldLabel>
          <select
            id="users-status"
            name="status"
            defaultValue={statusFilter}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <Field className="w-full min-w-[8rem] md:w-36">
          <FieldLabel htmlFor="users-page-size">Per page</FieldLabel>
          <select
            id="users-page-size"
            name="pageSize"
            defaultValue={String(pageSize)}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" className="h-8 w-full shrink-0 md:w-auto">
          Apply filters
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Username</TableHead>
              <TableHead className="px-4">Role</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="hidden px-4 md:table-cell">Added</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                    <p className="font-medium text-foreground">
                      No users match these filters
                    </p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Try another search term or change role and status filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="px-4 font-medium">{u.name}</TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {u.username ?? u.email.split("@")[0]}
                  </TableCell>
                  <TableCell className="px-4 capitalize">{u.role}</TableCell>
                  <TableCell className="px-4">
                    {u.isActive ? (
                      <Badge
                        variant="secondary"
                        className="border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-200"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden px-4 text-muted-foreground md:table-cell">
                    {formatAdded(u.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm">
                      <button
                        type="button"
                        className="cursor-pointer font-medium text-primary hover:underline"
                        onClick={() => setViewing(u)}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3.5" aria-hidden />
                          View
                        </span>
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer font-medium text-primary hover:underline"
                        onClick={() => setEditing(u)}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </span>
                      </button>
                      {canDeactivate(u) && (
                        <button
                          type="button"
                          className="cursor-pointer font-medium text-destructive hover:underline"
                          onClick={() =>
                            setStatusConfirm({ user: u, nextActive: false })
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            <PowerOff className="size-3.5" aria-hidden />
                            Deactivate
                          </span>
                        </button>
                      )}
                      {canActivate(u) && (
                        <button
                          type="button"
                          className="cursor-pointer font-medium text-primary hover:underline"
                          onClick={() =>
                            setStatusConfirm({ user: u, nextActive: true })
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            <Power className="size-3.5" aria-hidden />
                            Activate
                          </span>
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          total={total}
          page={page}
          pageSize={pageSize}
          buildHref={buildHref}
          aria-label="Users list pagination"
        />
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[min(90vh,36rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add specialist</DialogTitle>
            <DialogDescription>
              They can sign in with the username and temporary password you set.
            </DialogDescription>
          </DialogHeader>
          <UserCreateForm
            onFinished={() => setCreateOpen(false)}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>User details</DialogTitle>
                <DialogDescription>Read-only summary.</DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{viewing.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Username</dt>
                  <dd className="font-mono">
                    {viewing.username ?? viewing.email.split("@")[0]}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="break-all font-mono text-xs">{viewing.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Role</dt>
                  <dd className="capitalize">{viewing.role}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{viewing.isActive ? "Active" : "Inactive"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Added</dt>
                  <dd>{formatAdded(viewing.createdAt)}</dd>
                </div>
              </dl>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setViewing(null)}>
                  Close
                </Button>
                <Button type="button" onClick={() => {
                  setViewing(null);
                  setEditing(viewing);
                }}>
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Edit user</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{editing.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="capitalize">{editing.role}</span>
                </DialogDescription>
              </DialogHeader>
              <UserEditForm
                key={editing.id}
                userId={editing.id}
                initialName={editing.name}
                initialUsername={
                  editing.username ?? editing.email.split("@")[0] ?? ""
                }
                initialActive={editing.isActive}
                role={editing.role}
                onFinished={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setStatusConfirm(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!statusPending}>
          {statusConfirm && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {statusConfirm.nextActive ? "Activate account?" : "Deactivate account?"}
                </DialogTitle>
                <DialogDescription>
                  {statusConfirm.nextActive
                    ? `${statusConfirm.user.name} will be able to sign in again.`
                    : `${statusConfirm.user.name} will not be able to sign in until reactivated.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={statusPending}
                  onClick={() => setStatusConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={statusConfirm.nextActive ? "default" : "destructive"}
                  disabled={statusPending}
                  onClick={() => void onConfirmStatus()}
                >
                  {statusPending
                    ? "Saving…"
                    : statusConfirm.nextActive
                      ? "Activate"
                      : "Deactivate"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
