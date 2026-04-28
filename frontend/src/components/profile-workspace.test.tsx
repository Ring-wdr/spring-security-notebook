import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileWorkspace } from "./profile-workspace";
import type { AuthenticatedSession } from "@/lib/types";

describe("ProfileWorkspace", () => {
  it("renders the authenticated identity, authorities, and token timing in one dossier surface", () => {
    const session: AuthenticatedSession = {
      tokens: {
        grantType: "Bearer",
        accessToken: "access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresIn: 600,
        refreshTokenExpiresIn: 86400,
      },
      user: {
        email: "user@example.com",
        nickname: "user",
        social: false,
        roleNames: ["ROLE_USER"],
      },
    };

    const { container } = render(<ProfileWorkspace session={session} />);

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Authenticated user profile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Token timing" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nickname")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("Grant type")).toBeInTheDocument();
    expect(screen.getByText("Bearer")).toBeInTheDocument();
    expect(screen.getByText("ROLE_USER")).toBeInTheDocument();
    expect(screen.getByText("Access token TTL (sec)")).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument();
    expect(screen.getByText("Refresh token TTL (sec)")).toBeInTheDocument();
    expect(screen.getByText("86400")).toBeInTheDocument();

    const authoritiesRail = screen
      .getByRole("heading", { name: "Authorities" })
      .closest("section");

    expect(authoritiesRail).not.toBeNull();
    expect(within(authoritiesRail!).getByText("ROLE_USER")).toBeInTheDocument();
  });
});
