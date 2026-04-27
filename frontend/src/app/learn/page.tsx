import Link from "next/link";
import { Suspense } from "react";

import {
  LECTURE_AUDIT_ITEMS,
  createLearningSnapshot,
  describeProtectedRouteAccess,
} from "@/lib/learn";
import { getOptionalSession } from "@/lib/server/session";

const UNAUTHORIZED_ROUTE = describeProtectedRouteAccess("unauthorized");
const FORBIDDEN_ROUTE = describeProtectedRouteAccess("forbidden");

export default function LearnPage() {
  return (
    <Suspense fallback={<LearnPageSkeleton />}>
      <LearnWorkspace />
    </Suspense>
  );
}

async function LearnWorkspace() {
  const session = await getOptionalSession();
  const snapshot = createLearningSnapshot(session);

  return (
    <div className="grid gap-6">
      <section className="panel space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">Lecture Companion</p>
          <h1 className="text-3xl font-semibold">
            Spring Security and JWT implementation guide
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--muted-foreground)]">
            This page turns the current backend and frontend into a walkthrough
            for the 10-part lecture sequence. It does not expose raw JWT values.
            Instead, it shows the metadata and route behavior you can verify
            while stepping through the project.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
              Current auth state
            </p>
            <p className="mt-3 text-2xl font-semibold capitalize">{snapshot.state}</p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted-foreground)]">
              {snapshot.primaryMessage}
            </p>
            {snapshot.roleNames.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {snapshot.roleNames.map((role) => (
                  <span key={role} className="badge">
                    {role}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
              Guided route checks
            </p>
            <div className="mt-4 grid gap-3">
              <GuideLink href="/login" label="Login form" body="Exercise the Spring Security login processing URL." />
              <GuideLink href="/me" label="Current principal" body="Confirm the authenticated subscriber and granted roles." />
              <GuideLink href="/manage/content" label="Manager content" body="Check manager or admin-only authoring behavior." />
              <GuideLink href="/manage/users" label="Admin roles" body="Observe the 403 boundary for non-admin sessions." />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel space-y-5">
          <div className="space-y-3">
            <p className="eyebrow">Token Lifecycle</p>
            <h2 className="text-2xl font-semibold">Metadata only</h2>
          </div>
          {snapshot.tokenMetadata.length > 0 ? (
            <div className="grid gap-3">
              {snapshot.tokenMetadata.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
              Token metadata appears after login. Use a seeded account, then come
              back to compare access and refresh TTL values.
            </p>
          )}
          <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4 text-sm leading-7 text-[color:var(--muted-foreground)]">
            The frontend stores token pairs in the session cookie, retries one
            protected request after a 401, and clears the session if refresh
            also fails. Logout removes the stored refresh token on the backend.
          </div>
        </div>

        <div className="panel space-y-5">
          <div className="space-y-3">
            <p className="eyebrow">Protected Routes</p>
            <h2 className="text-2xl font-semibold">What 401 and 403 mean here</h2>
          </div>
          <RouteOutcomeCard
            title="Unauthorized"
            status={UNAUTHORIZED_ROUTE.status}
            code={UNAUTHORIZED_ROUTE.code}
            summary={UNAUTHORIZED_ROUTE.summary}
            body="This happens when no authenticated principal is available for a protected backend route."
          />
          <RouteOutcomeCard
            title="Forbidden"
            status={FORBIDDEN_ROUTE.status}
            code={FORBIDDEN_ROUTE.code}
            summary={FORBIDDEN_ROUTE.summary}
            body="This happens when the principal is valid but lacks the required role, such as opening the admin users screen as a manager."
          />
        </div>
      </section>

      <section className="panel space-y-5">
        <div className="space-y-3">
          <p className="eyebrow">Lecture Audit</p>
          <h2 className="text-2xl font-semibold">How the current repo maps to the 10 lessons</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LECTURE_AUDIT_ITEMS.map((item) => (
            <article
              key={item.step}
              className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold">{item.step}. {item.title}</p>
                <span className="badge">{formatStatus(item.status)}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted-foreground)]">
                {item.summary}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function LearnPageSkeleton() {
  return (
    <section className="panel space-y-4">
      <p className="eyebrow">Lecture Companion</p>
      <h1 className="text-2xl font-semibold">Loading the learning guide...</h1>
      <p className="text-sm text-[color:var(--muted-foreground)]">
        Preparing the current session snapshot and lecture audit cards.
      </p>
    </section>
  );
}

function RouteOutcomeCard({
  title,
  status,
  code,
  summary,
  body,
}: {
  title: string;
  status: number;
  code: string;
  summary: string;
  body: string;
}) {
  return (
    <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold">{title}</p>
        <span className="badge">HTTP {status}</span>
      </div>
      <p className="mt-3 font-medium">{code}</p>
      <p className="mt-2 text-sm leading-7 text-[color:var(--muted-foreground)]">
        {summary} {body}
      </p>
    </div>
  );
}

function GuideLink({
  href,
  label,
  body,
}: {
  href: string;
  label: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4 transition hover:border-[color:var(--border-strong)]"
    >
      <p className="font-medium">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
        {body}
      </p>
    </Link>
  );
}

function formatStatus(status: (typeof LECTURE_AUDIT_ITEMS)[number]["status"]) {
  return status.replaceAll("_", " ");
}
