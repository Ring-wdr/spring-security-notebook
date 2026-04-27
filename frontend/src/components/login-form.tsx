"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, type LoginFormState } from "@/app/actions/session";
import type { DisplayError } from "@/lib/auth-errors";
import { LoginFormView } from "@/components/login-form-view";

const INITIAL_LOGIN_FORM_STATE: LoginFormState = {
  error: null,
};

export function LoginForm({
  initialError = null,
}: {
  initialError?: DisplayError | null;
}) {
  const [state, formAction] = useActionState(
    loginAction,
    {
      ...INITIAL_LOGIN_FORM_STATE,
      error: initialError,
    },
  );

  return (
    <form className="space-y-4" action={formAction}>
      <SubmitStateView error={state.error} />
    </form>
  );
}

function SubmitStateView({
  error,
}: {
  error: DisplayError | null;
}) {
  const { pending } = useFormStatus();

  return <LoginFormView error={error} pending={pending} />;
}
