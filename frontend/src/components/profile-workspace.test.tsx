import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileWorkspace } from "./profile-workspace";
import type { StoredSession } from "@/lib/types";

describe("ProfileWorkspace", () => {
  it("renders the authenticated user profile and token timing in one dossier surface", () => {
    const session: StoredSession = {
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
  });
});
