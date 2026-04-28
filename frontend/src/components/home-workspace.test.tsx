import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeWorkspace } from "./home-workspace";
import type { StoredSession } from "@/lib/types";

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
  it("renders the anonymous home surface with the practice tracks and session rail", () => {
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
    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(screen.getByText("Sign in to load identity")).toBeInTheDocument();
  });

  it("renders a neutral loading state without claiming the visitor is anonymous", () => {
    render(<HomeWorkspace session={null} sessionState="loading" />);

    expect(screen.getByText("Resolving session")).toBeInTheDocument();
    expect(
      screen.getByText("Waiting for the server session snapshot"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Sign in to load identity"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("anonymous")).not.toBeInTheDocument();
  });

  it("renders authenticated profile and authorities when a session is available", () => {
    const session: StoredSession = {
      tokens: {
        grantType: "Bearer",
        accessToken: "access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresIn: 600,
        refreshTokenExpiresIn: 86400,
      },
      user: {
        email: "manager@example.com",
        nickname: "manager",
        social: false,
        roleNames: ["ROLE_MANAGER", "ROLE_ADMIN"],
      },
    };

    render(<HomeWorkspace session={session} />);

    const currentSession = screen
      .getByRole("heading", { name: "Current session" })
      .closest("section");

    expect(currentSession).not.toBeNull();

    const currentSessionScope = within(currentSession!);
    expect(currentSessionScope.getByText("authenticated")).toBeInTheDocument();
    expect(currentSessionScope.getByText("manager")).toBeInTheDocument();
    expect(
      currentSessionScope.getAllByText("manager@example.com")[0],
    ).toBeInTheDocument();
    expect(currentSessionScope.getAllByText("ROLE_MANAGER").length).toBeGreaterThan(0);
    expect(currentSessionScope.getAllByText("ROLE_ADMIN").length).toBeGreaterThan(0);
  });
});
