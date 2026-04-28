import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeWorkspace } from "./home-workspace";

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

describe("HomeWorkspace", () => {
  it("renders the home dossier surface with primary tracks and session rail", () => {
    const { container } = render(<HomeWorkspace session={null} />);

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        name: "Spring Security, JWT, and Next.js auth flow in one learning surface.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Primary tracks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Current session" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });
});
