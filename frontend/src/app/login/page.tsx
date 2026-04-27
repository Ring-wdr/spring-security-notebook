"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("1111");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/me");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      router.replace("/me");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "ERROR_LOGIN");
    } finally {
      setSubmitting(false);
    }
  }

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
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="1111"
            />
          </label>
          {error ? (
            <div className="rounded-[18px] border border-[color:var(--warn)]/35 bg-[color:var(--warn)]/12 px-4 py-3 text-sm text-[color:var(--warn)]">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            className="button-primary w-full"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
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
            <button
              key={nextEmail}
              type="button"
              className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-4 text-left transition hover:border-[color:var(--border-strong)]"
              onClick={() => {
                setEmail(nextEmail);
                setPassword("1111");
              }}
            >
              <p className="font-medium">{label}</p>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                {nextEmail}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
