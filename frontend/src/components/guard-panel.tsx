import type { ReactNode } from "react";

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
    <section className="panel mx-auto max-w-3xl space-y-4">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-[color:var(--muted-foreground)]">{body}</p>
      {children}
    </section>
  );
}
