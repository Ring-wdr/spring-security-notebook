import { Suspense } from "react";
import Link from "next/link";

const DEMO_ACCOUNTS = [
  { label: "User", email: "user@example.com", role: "ROLE_USER" },
  { label: "Manager", email: "manager@example.com", role: "ROLE_MANAGER" },
  { label: "Admin", email: "admin@example.com", role: "ROLE_ADMIN" },
];

import { getOptionalSession } from "@/lib/server/session";
import type { StoredSession } from "@/lib/types";

export default function Home() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
      <section className="panel space-y-6">
        <div className="space-y-4">
          <p className="eyebrow">Practice Workspace</p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            Spring Security, JWT, and Next.js auth flow in one learning surface.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)]">
            This frontend is wired against the live Spring Boot security
            pipeline. Log in, inspect the issued tokens, browse subscriber
            content, and try manager or admin-only workflows with the same
            session.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ShortcutCard
            title="Learn"
            body="Follow the 10 lecture checkpoints with live auth metadata and protected-route examples."
            href="/learn"
          />
          <ShortcutCard
            title="Login"
            body="Start the Spring Security form-login flow and receive access + refresh tokens."
            href="/login"
          />
          <ShortcutCard
            title="My Profile"
            body="Validate the current JWT-backed identity and role mapping."
            href="/me"
          />
          <ShortcutCard
            title="Contents"
            body="Read published subscriber content through protected API calls."
            href="/content"
          />
          <ShortcutCard
            title="Manager/Admin"
            body="Exercise role-gated update surfaces and observe 403 boundaries."
            href="/manage/content"
          />
        </div>
      </section>

      <Suspense fallback={<SessionSnapshotCard session={null} />}>
        <SessionSnapshot />
      </Suspense>
    </div>
  );
}

async function SessionSnapshot() {
  const session = await getOptionalSession();
  return <SessionSnapshotCard session={session} />;
}

function SessionSnapshotCard({ session }: { session: StoredSession | null }) {
  return (
    <section className="panel space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Current Session</p>
        <h2 className="text-2xl font-semibold">Auth state snapshot</h2>
        <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
          Use the demo credentials from the backend initializer. Password for
          all accounts is <strong>1111</strong>.
        </p>
      </div>

      <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
        <p className="text-sm font-medium text-[color:var(--muted-foreground)]">
          Status
        </p>
        <p className="mt-2 text-2xl font-semibold capitalize">
          {session ? "authenticated" : "anonymous"}
        </p>
        {session?.user ? (
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-medium">{session.user.nickname}</p>
              <p className="text-[color:var(--muted-foreground)]">
                {session.user.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.user.roleNames.map((role) => (
                <span key={role} className="badge">
                  {role}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">
            No authenticated profile is loaded yet.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {DEMO_ACCOUNTS.map((account) => (
          <div
            key={account.email}
            className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{account.label}</p>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  {account.email}
                </p>
              </div>
              <span className="badge">{account.role}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShortcutCard({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]"
    >
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
        {body}
      </p>
    </Link>
  );
}
