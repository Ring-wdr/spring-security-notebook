"use client";

import { ApiClientError, apiRequest } from "@/lib/api-client";
import type { SubscriberSummary } from "@/lib/types";
import { startTransition, useOptimistic, useState } from "react";

const ALL_ROLES = ["ROLE_USER", "ROLE_MANAGER", "ROLE_ADMIN"];

type RoleMutation = {
  email: string;
  role: string;
  enabled: boolean;
};

export function ManageUsersClient({
  initialUsers,
}: {
  initialUsers: SubscriberSummary[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [optimisticUsers, applyOptimisticUpdate] = useOptimistic(
    users,
    (currentUsers, mutation: RoleMutation) =>
      currentUsers.map((user) => {
        if (user.email !== mutation.email) {
          return user;
        }

        const roleSet = new Set(user.roleNames);
        if (mutation.enabled) {
          roleSet.add(mutation.role);
        } else {
          roleSet.delete(mutation.role);
        }

        return {
          ...user,
          roleNames: Array.from(roleSet),
        };
      }),
  );
  const [savingEmail, setSavingEmail] = useState<string | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  async function reloadUsers() {
    const response = await apiRequest<SubscriberSummary[]>("/api/admin/users");
    setUsers(response);
  }

  async function toggleRole(email: string, role: string, enabled: boolean) {
    startTransition(() => {
      applyOptimisticUpdate({ email, role, enabled });
    });

    const nextUser = optimisticUsers
      .map((user) => {
        if (user.email !== email) {
          return user;
        }

        const roleSet = new Set(user.roleNames);
        if (enabled) {
          roleSet.add(role);
        } else {
          roleSet.delete(role);
        }

        return {
          ...user,
          roleNames: Array.from(roleSet),
        };
      })
      .find((user) => user.email === email);

    if (!nextUser || nextUser.roleNames.length === 0) {
      setError({
        code: "ERROR_BAD_REQUEST",
        message: "At least one role must remain assigned.",
      });
      return;
    }

    try {
      setSavingEmail(email);
      setError(null);
      const response = await apiRequest<SubscriberSummary>(
        `/api/admin/users/${encodeURIComponent(email)}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ roleNames: nextUser.roleNames }),
        },
      );

      setUsers((current) =>
        current.map((user) => (user.email === email ? response : user)),
      );
    } catch (nextError) {
      setError(toUserError(nextError));
      await reloadUsers();
    } finally {
      setSavingEmail(null);
    }
  }

  return (
    <section className="panel space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Admin Surface</p>
        <h1 className="text-3xl font-semibold">Manage subscriber roles</h1>
        <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
          Each change issues a{" "}
          <code>PATCH /api/admin/users/{"{email}"}/role</code> request with the
          currently checked role set.
        </p>
      </div>
      {error ? (
        <div className="rounded-[20px] border border-[color:var(--warn)]/35 bg-[color:var(--warn)]/12 px-4 py-3 text-sm text-[color:var(--warn)]">
          <p className="font-semibold">{error.code}</p>
          <p className="mt-1">{error.message}</p>
        </div>
      ) : null}
      <div className="grid gap-4">
        {optimisticUsers.map((user) => (
          <section
            key={user.email}
            className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{user.nickname}</p>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  {user.email}
                </p>
              </div>
              {savingEmail === user.email ? (
                <span className="text-sm text-[color:var(--muted-foreground)]">
                  Saving...
                </span>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {ALL_ROLES.map((role) => {
                const checked = user.roleNames.includes(role);
                return (
                  <label
                    key={role}
                    className="flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        void toggleRole(user.email, role, event.target.checked)
                      }
                    />
                    {role}
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function toUserError(error: unknown) {
  if (error instanceof ApiClientError) {
    return {
      code: error.code,
      message: error.displayMessage,
    };
  }

  return {
    code: "ERROR_USERS",
    message: "Unable to update subscriber roles.",
  };
}
