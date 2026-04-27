"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, type LoginFormState } from "@/app/actions/session";

const INITIAL_LOGIN_FORM_STATE: LoginFormState = {
  error: null,
};

export function LoginForm() {
  const [state, formAction] = useActionState(
    loginAction,
    INITIAL_LOGIN_FORM_STATE,
  );

  return (
    <form className="space-y-4" action={formAction}>
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
      {state.error ? (
        <div className="rounded-[18px] border border-[color:var(--warn)]/35 bg-[color:var(--warn)]/12 px-4 py-3 text-sm text-[color:var(--warn)]">
          {state.error}
        </div>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button-primary w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
