import type { Route } from "next";
import Link from "next/link";
import { useId, type ReactNode } from "react";

export function DossierSurface({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const titleId = useId();

  return (
    <section className="dossier-surface" aria-labelledby={titleId}>
      <div className="space-y-3">
        <p className="eyebrow">{eyebrow}</p>
        <div className="space-y-2">
          <h1 id={titleId} className="text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          {intro ? (
            <p className="max-w-3xl text-sm leading-7 text-[color:var(--dossier-muted-foreground)]">
              {intro}
            </p>
          ) : null}
        </div>
      </div>
      <div className="dossier-stack">{children}</div>
    </section>
  );
}

export function DossierSection({
  heading,
  children,
  rail = false,
}: {
  heading: string;
  children: ReactNode;
  rail?: boolean;
}) {
  return (
    <section className={`dossier-section${rail ? " dossier-rail" : ""}`}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
        {children}
      </div>
    </section>
  );
}

export function DossierRail({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <DossierSection heading={heading} rail>
      {children}
    </DossierSection>
  );
}

export function ActionTile({
  href,
  title,
  body,
}: {
  href: Route;
  title: string;
  body: string;
}) {
  const titleId = useId();
  const bodyId = useId();

  return (
    <Link
      href={href}
      className="action-tile"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <span id={titleId} className="text-sm font-semibold tracking-tight">
        {title}
      </span>
      <span
        id={bodyId}
        className="text-sm leading-6 text-[color:var(--dossier-muted-foreground)]"
      >
        {body}
      </span>
    </Link>
  );
}

export function DataTile({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="data-tile">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--dossier-muted-foreground)]">
        {label}
      </span>
      <span className="text-sm font-medium text-[color:var(--dossier-foreground)]">
        {value}
      </span>
    </div>
  );
}
