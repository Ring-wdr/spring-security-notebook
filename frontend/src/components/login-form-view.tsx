"use client";

import type { DisplayError } from "@/lib/auth-errors";

export function LoginFormView({
  error = null,
  pending = false,
}: {
  error?: DisplayError | null;
  pending?: boolean;
}) {
  return (
    <>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Email</span>
        <input
          className="field"
          name="email"
          defaultValue="user@example.com"
          placeholder="user@example.com"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Password</span>
        <input
          className="field"
          name="password"
          type="password"
          defaultValue="1111"
          placeholder="1111"
        />
      </label>
      {error ? (
        <div className="rounded-[18px] border border-[color:var(--warn)]/35 bg-[color:var(--warn)]/12 px-4 py-3 text-sm text-[color:var(--warn)]">
          <p className="font-semibold">{error.code}</p>
          <p className="mt-1">{error.message}</p>
        </div>
      ) : null}
      <button type="submit" className="button-primary w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </>
  );
}
