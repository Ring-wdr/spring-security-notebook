import {
  DataTile,
  DossierRail,
  DossierSection,
  DossierSurface,
} from "@/components/dossier";
import type { AuthenticatedSession } from "@/lib/types";

type ProfileWorkspaceProps = {
  session: AuthenticatedSession;
};

export function ProfileWorkspace({ session }: ProfileWorkspaceProps) {
  return (
    <DossierSurface
      eyebrow="Current Principal"
      title="Protected profile dossier"
      intro="This authenticated view is resolved on the server through the secured backend session. It summarizes the current principal, granted authorities, and token timing without exposing raw token bodies."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,_1.15fr)_minmax(320px,_0.85fr)]">
        <DossierSection heading="Authenticated user profile">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              The identity summary below reflects the current JWT-backed session
              snapshot returned from the protected <code>/me</code> flow.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <DataTile label="Nickname" value={session.user.nickname} />
              <DataTile label="Email" value={session.user.email} />
              <DataTile
                label="Social login"
                value={session.user.social ? "true" : "false"}
              />
              <DataTile label="Grant type" value={session.tokens.grantType} />
            </div>
          </div>
        </DossierSection>

        <DossierRail heading="Authorities">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              Granted authorities are mapped from the authenticated subscriber
              and determine which protected routes stay available.
            </p>
            <div className="flex flex-wrap gap-2">
              {session.user.roleNames.map((role) => (
                <span key={role} className="badge">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </DossierRail>
      </div>

      <DossierSection heading="Token timing">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DataTile
              label="Access token TTL (sec)"
              value={String(session.tokens.accessTokenExpiresIn)}
            />
            <DataTile
              label="Refresh token TTL (sec)"
              value={String(session.tokens.refreshTokenExpiresIn)}
            />
          </div>
          <div className="rounded-[20px] border border-[color:var(--dossier-border)] bg-[color:var(--dossier-surface)] px-4 py-4 text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
            Protected server routes redirect through the internal
            refresh-session flow when the access token expires. Logout revokes
            the current access token and clears the stored refresh token on the
            backend.
          </div>
        </div>
      </DossierSection>
    </DossierSurface>
  );
}
