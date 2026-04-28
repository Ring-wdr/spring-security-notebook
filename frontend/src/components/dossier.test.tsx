import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ActionTile,
  DataTile,
  DossierRail,
  DossierSection,
  DossierSurface,
} from "./dossier";

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
  it("renders the shared dossier surface shell contract", () => {
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
    expect(container.querySelectorAll(".dossier-stack")).toHaveLength(1);
    expect(container.querySelectorAll(".dossier-section")).toHaveLength(2);
    expect(container.querySelectorAll(".dossier-rail")).toHaveLength(1);
    expect(container.querySelectorAll(".action-tile")).toHaveLength(1);
    expect(container.querySelectorAll(".data-tile")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Surface title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Primary tracks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Current session" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A calm shared shell for the learning surface."),
    ).toBeInTheDocument();

    const learnLink = screen.getByRole("link", { name: "Learn" });
    expect(learnLink).toBeInTheDocument();
    expect(learnLink).toHaveAttribute("href", "/learn");
    expect(learnLink).toHaveClass("action-tile");
    expect(
      screen.getByText("Continue with the guided lecture companion."),
    ).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();
  });
});
