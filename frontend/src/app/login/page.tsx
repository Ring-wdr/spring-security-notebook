import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { createDisplayError, getErrorCode } from "@/lib/auth-errors";
import { buildRefreshSessionRedirectPath } from "@/lib/server/refresh-session";
import { getOptionalSession } from "@/lib/server/session";
import { cookies } from "next/headers";
import { readSessionCookie } from "@/lib/server/session-cookie";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<LoginLayout />}>
      <LoginGate searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginGate({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  if (await getOptionalSession()) {
    redirect("/me");
  }

  const cookieStore = await cookies();
  if (readSessionCookie(cookieStore)) {
    redirect(buildRefreshSessionRedirectPath("/me"));
  }

  const params = await searchParams;
  const errorCode = getErrorCode(params.error);
  return (
    <LoginLayout
      initialError={
        errorCode ? createDisplayError(errorCode) : null
      }
    />
  );
}

function LoginLayout({
  initialError = null,
}: {
  initialError?: { code: string; message: string } | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="panel space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">JWT Login</p>
          <h1 className="text-3xl font-semibold">Authenticate against the backend filter chain</h1>
          <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
            This form posts directly to the Spring Security login processing URL
            and then loads your current user profile with the issued access
            token.
          </p>
        </div>
        <LoginForm initialError={initialError} />
      </section>

      <section className="panel space-y-4">
        <p className="eyebrow">Demo Accounts</p>
        <h2 className="text-2xl font-semibold">Quick presets</h2>
        <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
          All seeded users share the same password. Select one to prefill the
          form.
        </p>
        <div className="grid gap-3">
          {[ 
            ["User", "user@example.com"],
            ["Manager", "manager@example.com"],
            ["Admin", "admin@example.com"],
          ].map(([label, nextEmail]) => (
            <div
              key={nextEmail}
              className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-4 text-left"
            >
              <p className="font-medium">{label}</p>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                {nextEmail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
