import type { ReactNode } from "react";

import { DossierSurface } from "@/components/dossier";

export function GuardPanel({
  eyebrow = "Protected Route",
  title,
  body,
  children,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <DossierSurface eyebrow={eyebrow} title={title} intro={body}>
        {children ?? null}
      </DossierSurface>
    </div>
  );
}
