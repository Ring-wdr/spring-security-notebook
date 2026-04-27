"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";

export default function MePage() {
  const { session } = useAuth();

  return (
    <AuthGuard>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="panel space-y-5">
          <p className="eyebrow">Current Principal</p>
          <h1 className="text-3xl font-semibold">Authenticated user profile</h1>
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileMetric label="Nickname" value={session?.user?.nickname ?? "-"} />
            <ProfileMetric label="Email" value={session?.user?.email ?? "-"} />
            <ProfileMetric
              label="Social login"
              value={session?.user?.social ? "true" : "false"}
            />
            <ProfileMetric
              label="Grant type"
              value={session?.tokens.grantType ?? "-"}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[color:var(--muted-foreground)]">
              Authorities
            </p>
            <div className="flex flex-wrap gap-2">
              {session?.user?.roleNames.map((role) => (
                <span key={role} className="badge">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="panel space-y-5">
          <p className="eyebrow">Token Lifecycle</p>
          <h2 className="text-2xl font-semibold">Session timing</h2>
          <div className="space-y-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
            <ProfileMetric
              label="Access token TTL (sec)"
              value={String(session?.tokens.accessTokenExpiresIn ?? "-")}
            />
            <ProfileMetric
              label="Refresh token TTL (sec)"
              value={String(session?.tokens.refreshTokenExpiresIn ?? "-")}
            />
            <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
              The API client retries once with `/api/auth/refresh` whenever a
              protected request returns 401 and a refresh token is present.
            </p>
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 break-all text-base font-medium">{value}</p>
    </div>
  );
}
