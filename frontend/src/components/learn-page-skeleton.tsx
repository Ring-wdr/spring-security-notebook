import {
  DossierRail,
  DossierSection,
  DossierSurface,
} from "@/components/dossier";

export function LearnPageSkeleton() {
  return (
    <DossierSurface
      eyebrow="Lecture Companion"
      title="Spring Security and JWT implementation guide"
      intro="Preparing the current session snapshot, protected-route outcomes, and lecture audit cards."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,_1.25fr)_minmax(320px,_0.75fr)]">
        <DossierSection heading="Implementation guide">
          <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
            Loading the current learning surface so the live auth flow and
            lecture walkthrough can appear in one dossier shell.
          </p>
        </DossierSection>
        <DossierRail heading="Current auth state">
          <p className="text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
            Resolving the session snapshot before showing the current principal
            and token metadata branches.
          </p>
        </DossierRail>
      </div>
    </DossierSurface>
  );
}
