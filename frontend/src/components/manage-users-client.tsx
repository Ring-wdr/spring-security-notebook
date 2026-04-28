"use client";

import { DossierSection, DossierSurface } from "@/components/dossier";
import { ApiClientError, apiRequest, backendApi } from "@/lib/api-client";
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
    const response = await apiRequest(() =>
      backendApi.adminSubscribers.getSubscribers(),
    );
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
      const response = await apiRequest(() =>
        backendApi.adminSubscribers.updateRoles({
          email,
          updateSubscriberRolesRequest: {
            roleNames: nextUser.roleNames,
          },
        }),
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
    <DossierSurface
      eyebrow="Admin Surface"
      title="Manage subscriber roles"
      intro='Each change issues a PATCH /api/admin/users/{email}/role request with the currently checked role set.'
    >
      <DossierSection heading="User role assignments">
        <div className="space-y-4">
          {error ? (
            <div className="rounded-[20px] border border-[color:var(--warn)]/35 bg-[color:var(--warn)]/12 px-4 py-3 text-sm text-[color:var(--warn)]">
              <p className="font-semibold">{error.code}</p>
              <p className="mt-1">{error.message}</p>
            </div>
          ) : null}
          <div className="grid gap-3">
            {optimisticUsers.map((user) => (
              <article
                key={user.email}
                className="user-role-row rounded-[22px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface-strong)] px-5 py-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold">{user.nickname}</p>
                      <span className="badge">
                        {user.social ? "Social" : "Direct"}
                      </span>
                    </div>
                    <p className="text-sm text-[color:var(--dossier-muted-foreground)]">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    {savingEmail === user.email ? (
                      <span className="text-sm text-[color:var(--dossier-muted-foreground)]">
                        Saving...
                      </span>
                    ) : null}
                    <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
                      {ALL_ROLES.map((role) => {
                        const checked = user.roleNames.includes(role);
                        return (
                          <label
                            key={role}
                            className="flex items-center gap-2 rounded-full border border-[color:var(--dossier-border)] px-4 py-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                void toggleRole(
                                  user.email,
                                  role,
                                  event.target.checked,
                                )
                              }
                            />
                            {role}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </DossierSection>
    </DossierSurface>
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
