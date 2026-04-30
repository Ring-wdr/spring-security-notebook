import { LoginForm } from "@/components/login-form";

export function LoginLayout({
  initialError = null,
}: {
  initialError?: { code: string; message: string } | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="panel space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">JWT Login</p>
          <h1 className="text-3xl font-semibold">
            Authenticate against the backend filter chain
          </h1>
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
