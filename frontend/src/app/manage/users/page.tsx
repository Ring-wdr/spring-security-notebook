"use client";

import { AuthGuard } from "@/components/auth-guard";
import { apiRequest } from "@/lib/api-client";
import type { SubscriberSummary } from "@/lib/types";
import { useEffect, useState } from "react";

const ALL_ROLES = ["ROLE_USER", "ROLE_MANAGER", "ROLE_ADMIN"];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<SubscriberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest<SubscriberSummary[]>("/api/admin/users");
      setUsers(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "ERROR_USERS");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(email: string, role: string, enabled: boolean) {
    const nextUsers = users.map((user) => {
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
    });

    setUsers(nextUsers);

    const nextUser = nextUsers.find((user) => user.email === email);
    if (!nextUser || nextUser.roleNames.length === 0) {
      setError("At least one role must remain assigned.");
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
      setError(nextError instanceof Error ? nextError.message : "ERROR_USERS");
      await loadUsers();
    } finally {
      setSavingEmail(null);
    }
  }

  return (
    <AuthGuard roles={["ROLE_ADMIN"]}>
      <section className="panel space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">Admin Surface</p>
          <h1 className="text-3xl font-semibold">Manage subscriber roles</h1>
          <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
            Each change issues a{" "}
            <code>PATCH /api/admin/users/{"{email}"}/role</code> request with
            the currently checked role set.
          </p>
        </div>
        {error ? (
          <div className="rounded-[20px] border border-[color:var(--warn)]/35 bg-[color:var(--warn)]/12 px-4 py-3 text-sm text-[color:var(--warn)]">
            {error}
          </div>
        ) : null}
        {loading ? (
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading subscribers...</p>
        ) : (
          <div className="grid gap-4">
            {users.map((user) => (
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
        )}
      </section>
    </AuthGuard>
  );
}
