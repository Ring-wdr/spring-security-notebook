import {
  ActionTile,
  DataTile,
  DossierRail,
  DossierSection,
  DossierSurface,
} from "@/components/dossier";
import {
  LECTURE_AUDIT_ITEMS,
  type LearningSnapshot,
} from "@/lib/learn";

type LearnRouteOutcome = {
  status: 401 | 403;
  code: string;
  summary: string;
};

type LearnWorkspaceViewProps = {
  snapshot: LearningSnapshot;
  unauthorizedRoute: LearnRouteOutcome;
  forbiddenRoute: LearnRouteOutcome;
};

export function LearnWorkspaceView({
  snapshot,
  unauthorizedRoute,
  forbiddenRoute,
}: LearnWorkspaceViewProps) {
  return (
    <DossierSurface
      eyebrow="Lecture Companion"
      title="Spring Security and JWT implementation guide"
      intro="This page turns the current backend and frontend into a walkthrough for the 10-part lecture sequence. It does not expose raw JWT values. Instead, it shows the metadata and route behavior you can verify while stepping through the project."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,_1.25fr)_minmax(320px,_0.75fr)]">
        <DossierSection heading="Implementation guide">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              Follow the current Spring Security form login, inspect the
              principal and granted roles, compare protected-route outcomes,
              and map each behavior back to the lecture sequence without
              revealing raw JWT payload values in the UI.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <GuidePoint
                title="Protected route checks"
                body="Use /me, /manage/content, and /manage/users to compare the authenticated path, the 401 boundary, and the role-gated 403 boundary."
              />
              <GuidePoint
                title="Token safety"
                body="The surface only shows grant type, TTL, refresh behavior, and logout effects so the learning flow stays observable without exposing raw token bodies."
              />
            </div>
          </div>
        </DossierSection>

        <DossierRail heading="Current auth state">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              {snapshot.primaryMessage}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <DataTile
                label="State"
                value={<span className="capitalize">{snapshot.state}</span>}
              />
              <DataTile
                label="Roles"
                value={
                  snapshot.roleNames.length > 0 ? (
                    <span className="flex flex-wrap gap-2">
                      {snapshot.roleNames.map((role) => (
                        <span key={role} className="badge">
                          {role}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "Sign in to inspect granted authorities"
                  )
                }
              />
            </div>
          </div>
        </DossierRail>
      </div>

      <DossierSection heading="Guided route checks">
        <div className="grid max-w-5xl gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActionTile
            href="/login"
            title="Login form"
            body="Exercise the Spring Security login processing URL."
          />
          <ActionTile
            href="/me"
            title="Current principal"
            body="Confirm the authenticated subscriber and granted roles."
          />
          <ActionTile
            href="/manage/content"
            title="Manager content"
            body="Check manager or admin-only authoring behavior."
          />
          <ActionTile
            href="/manage/users"
            title="Admin roles"
            body="Observe the 403 boundary for non-admin sessions."
          />
        </div>
      </DossierSection>

      <DossierSection heading="Token lifecycle">
        <div className="space-y-4">
          {snapshot.tokenMetadata.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {snapshot.tokenMetadata.map((item) => (
                <DataTile key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              Token metadata appears after login. Use a seeded account, then
              come back to compare access and refresh TTL values.
            </p>
          )}
          <div className="rounded-[20px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface)] px-4 py-4 text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
            The frontend stores token pairs in the session cookie, redirects
            protected server routes through refresh-session when the access
            token expires, and clears the session if refresh fails. Logout
            revokes the current access token and removes the stored refresh
            token on the backend.
          </div>
        </div>
      </DossierSection>

      <DossierSection heading="Protected routes">
        <div className="grid gap-3 lg:grid-cols-2">
          <RouteOutcomeCard
            title="Unauthorized"
            route={unauthorizedRoute}
            body="This happens when no authenticated principal is available or when the presented access token has already expired or been revoked."
          />
          <RouteOutcomeCard
            title="Forbidden"
            route={forbiddenRoute}
            body="This happens when the principal is valid but lacks the required role, such as opening the admin users screen as a manager."
          />
        </div>
      </DossierSection>

      <DossierSection heading="Lecture audit">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LECTURE_AUDIT_ITEMS.map((item) => (
            <article
              key={item.step}
              className="rounded-[24px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface-strong)] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold">
                  {item.step}. {item.title}
                </p>
                <span className="badge">{formatStatus(item.status)}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
                {item.summary}
              </p>
            </article>
          ))}
        </div>
        <div className="rounded-[24px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface)] px-5 py-5 text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
          After logout, retrying a protected API with the same access token now
          fails with <code>ERROR_ACCESS_TOKEN</code>, which makes token
          revocation observable from the learning surface.
        </div>
      </DossierSection>
    </DossierSurface>
  );
}

function GuidePoint({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[20px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface-strong)] px-4 py-4">
      <p className="text-sm font-semibold tracking-tight">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--dossier-muted-foreground)]">
        {body}
      </p>
    </div>
  );
}

function RouteOutcomeCard({
  title,
  route,
  body,
}: {
  title: string;
  route: LearnRouteOutcome;
  body: string;
}) {
  return (
    <div className="rounded-[22px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface-strong)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold">{title}</p>
        <span className="badge">HTTP {route.status}</span>
      </div>
      <p className="mt-3 font-medium">{route.code}</p>
      <p className="mt-2 text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
        {route.summary} {body}
      </p>
    </div>
  );
}

function formatStatus(status: (typeof LECTURE_AUDIT_ITEMS)[number]["status"]) {
  return status.replaceAll("_", " ");
}
