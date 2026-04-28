import {
  ActionTile,
  DossierRail,
  DossierSection,
  DossierSurface,
} from "@/components/dossier";
import type { ReactNode } from "react";

import type { StoredSession } from "@/lib/types";

const PRIMARY_TRACKS = [
  {
    title: "Learn",
    body: "Follow the 10 lecture checkpoints with live auth metadata and protected-route examples.",
    href: "/learn",
  },
  {
    title: "Login",
    body: "Start the Spring Security form-login flow and receive access + refresh tokens.",
    href: "/login",
  },
  {
    title: "My Profile",
    body: "Validate the current JWT-backed identity and role mapping.",
    href: "/me",
  },
  {
    title: "Contents",
    body: "Read published subscriber content through protected API calls.",
    href: "/content",
  },
  {
    title: "Manager/Admin",
    body: "Exercise role-gated update surfaces and observe 403 boundaries.",
    href: "/manage/content",
  },
] as const;

const DEMO_ACCOUNTS = [
  { label: "User", email: "user@example.com", role: "ROLE_USER" },
  { label: "Manager", email: "manager@example.com", role: "ROLE_MANAGER" },
  { label: "Admin", email: "admin@example.com", role: "ROLE_ADMIN" },
] as const;

type HomeWorkspaceProps = {
  session: StoredSession | null;
  sessionState?: "resolved" | "loading";
};

export function HomeWorkspace({
  session,
  sessionState = "resolved",
}: HomeWorkspaceProps) {
  const isLoading = sessionState === "loading";
  const profile = !isLoading ? session?.user ?? null : null;
  const sessionSummary = getSessionSummary({ isLoading, profile });

  return (
    <DossierSurface
      eyebrow="Practice Workspace"
      title="Spring Security, JWT, and Next.js auth flow in one learning surface."
      intro="This frontend is wired against the live Spring Boot security pipeline. Log in, inspect the issued tokens, browse subscriber content, and try manager or admin-only workflows with the same session."
    >
      <DossierSection heading="Primary tracks">
        <div className="grid max-w-5xl gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PRIMARY_TRACKS.map((track) => (
            <ActionTile
              key={track.href}
              href={track.href}
              title={track.title}
              body={track.body}
            />
          ))}
        </div>
      </DossierSection>

      <DossierRail heading="Current session">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,_0.9fr)_minmax(0,_1.1fr)]">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              {isLoading ? (
                <>
                  Checking the stored session before showing the current
                  identity and role mapping.
                </>
              ) : (
                <>
                  Use the demo credentials from the backend initializer.
                  Password for all accounts is <strong>1111</strong>.
                </>
              )}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SessionMetricCard label="Status" value={sessionSummary.status} />
              <SessionMetricCard
                label="Profile"
                value={sessionSummary.profile}
              />
              <SessionMetricCard label="Email" value={sessionSummary.email} />
              <SessionMetricCard
                label="Authorities"
                value={sessionSummary.authorities}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-[color:var(--dossier-border)] pt-4 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-tight">
                Demo accounts
              </p>
              <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
                Each role maps to a backend-seeded account so you can compare
                authentication and authorization outcomes from one entry
                surface.
              </p>
            </div>
            <div className="space-y-3">
              {DEMO_ACCOUNTS.map((account) => (
                <div
                  key={account.email}
                  className="rounded-[20px] border border-[color:var(--dossier-border)] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{account.label}</p>
                      <p className="text-sm text-[color:var(--dossier-muted-foreground)]">
                        {account.email}
                      </p>
                    </div>
                    <span className="badge">{account.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DossierRail>
    </DossierSurface>
  );
}

function getSessionSummary({
  isLoading,
  profile,
}: {
  isLoading: boolean;
  profile: StoredSession["user"];
}) {
  if (isLoading) {
    return {
      status: "Resolving session",
      profile: "Waiting for the server session snapshot",
      email: "Identity details will appear once the request resolves",
      authorities: "Role mapping will appear after session resolution",
    };
  }

  if (profile) {
    return {
      status: "authenticated",
      profile: profile.nickname,
      email: profile.email,
      authorities: (
        <div className="flex flex-wrap gap-2">
          {profile.roleNames.map((role) => (
            <span key={role} className="badge">
              {role}
            </span>
          ))}
        </div>
      ),
    };
  }

  return {
    status: "anonymous",
    profile: "No profile loaded",
    email: "Sign in to load identity",
    authorities: "Sign in to inspect role mapping",
  };
}

function SessionMetricCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  const testId = `session-metric-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      data-testid={testId}
      className="rounded-[20px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface-strong)] px-4 py-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--dossier-muted-foreground)]">
        {label}
      </p>
      <div className="mt-3 text-sm font-medium text-[color:var(--dossier-foreground)]">
        {value}
      </div>
    </div>
  );
}
