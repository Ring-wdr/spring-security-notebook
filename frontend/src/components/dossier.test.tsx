import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    ...rest
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

describe("dossier primitives", () => {
  it("renders the shared dossier surface shell", async () => {
    const mod = await import("./dossier").catch(() => null);

    expect(mod?.DossierSurface).toBeDefined();
    expect(mod?.DossierSection).toBeDefined();
    expect(mod?.DossierRail).toBeDefined();
    expect(mod?.ActionTile).toBeDefined();
    expect(mod?.DataTile).toBeDefined();

    if (
      !mod?.DossierSurface ||
      !mod?.DossierSection ||
      !mod?.DossierRail ||
      !mod?.ActionTile ||
      !mod?.DataTile
    ) {
      return;
    }

    const {
      DossierSurface,
      DossierSection,
      DossierRail,
      ActionTile,
      DataTile,
    } = mod;

    const { container } = render(
      <DossierSurface
        eyebrow="Session overview"
        title="Surface title"
        intro="A calm shared shell for the learning surface."
      >
        <DossierSection heading="Primary tracks">
          <ActionTile
            href="/learn"
            title="Learn"
            body="Continue with the guided lecture companion."
          />
        </DossierSection>
        <DossierRail heading="Current session">
          <DataTile label="Role" value="Student" />
        </DossierRail>
      </DossierSurface>,
    );

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Surface title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Primary tracks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Current session" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learn" })).toBeInTheDocument();
  });
});
